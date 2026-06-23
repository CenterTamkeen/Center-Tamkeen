import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProgressStatus = "in_progress" | "completed";

function isProgressStatus(value: unknown): value is ProgressStatus {
  return value === "in_progress" || value === "completed";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    courseId?: unknown;
    lessonId?: unknown;
    status?: unknown;
    watchedSeconds?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const courseId = typeof payload.courseId === "string" ? payload.courseId : "";
  const lessonId = typeof payload.lessonId === "string" ? payload.lessonId : "";
  const status = isProgressStatus(payload.status)
    ? payload.status
    : "in_progress";
  const watchedSeconds =
    typeof payload.watchedSeconds === "number"
      ? Math.max(0, Math.round(payload.watchedSeconds))
      : 0;

  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: "Missing course or lesson ID." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!student) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [{ data: lesson }, { data: canAccess, error: accessError }] =
    await Promise.all([
      admin
        .from("lessons")
        .select("id, course_id, duration")
        .eq("id", lessonId)
        .eq("course_id", courseId)
        .maybeSingle(),
      admin.rpc("can_access_course", {
        course_uuid: courseId,
        student_uuid: student.id,
      }),
    ]);

  if (!lesson || accessError || !canAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: existingProgress } = await admin
    .from("lesson_progress")
    .select("watched_seconds, last_watched_at, status")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const now = new Date();
  const previousWatchedSeconds = existingProgress?.watched_seconds ?? 0;
  const previousWatchedAt = existingProgress?.last_watched_at
    ? new Date(existingProgress.last_watched_at)
    : now;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - previousWatchedAt.getTime()) / 1000),
  );
  const reportedIncrement = Math.max(
    0,
    watchedSeconds - previousWatchedSeconds,
  );
  const cappedIncrement = Math.min(
    elapsedSeconds > 0 ? elapsedSeconds + 5 : 0,
    reportedIncrement,
  );
  const nextWatchedSeconds = Math.max(
    previousWatchedSeconds,
    previousWatchedSeconds + cappedIncrement,
  );
  let validatedStatus = status;

  if (status === "completed") {
    const minimumWatchedSeconds = lesson.duration
      ? Math.floor(lesson.duration * 0.85)
      : Number.POSITIVE_INFINITY;

    if (nextWatchedSeconds < minimumWatchedSeconds) {
      validatedStatus = "in_progress";
    }
  }

  const nowIso = now.toISOString();
  const finalStatus =
    existingProgress?.status === "completed" ? "completed" : validatedStatus;
  const { data, error } = await admin
    .from("lesson_progress")
    .upsert(
      {
        student_id: student.id,
        course_id: courseId,
        lesson_id: lessonId,
        status: finalStatus,
        watched_seconds: nextWatchedSeconds,
        last_watched_at: nowIso,
        completed_at: finalStatus === "completed" ? nowIso : null,
      },
      { onConflict: "student_id,lesson_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save progress." },
      { status: 500 },
    );
  }

  return NextResponse.json({ progress: data });
}
