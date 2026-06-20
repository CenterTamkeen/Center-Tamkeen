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

  const [{ data: lesson }, { data: enrollment }] = await Promise.all([
    admin
      .from("lessons")
      .select("id, course_id")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .maybeSingle(),
    admin
      .from("enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("course_id", courseId)
      .maybeSingle(),
  ]);

  if (!lesson || !enrollment) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("lesson_progress")
    .upsert(
      {
        student_id: student.id,
        course_id: courseId,
        lesson_id: lessonId,
        status,
        watched_seconds: watchedSeconds,
        last_watched_at: now,
        completed_at: status === "completed" ? now : null,
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
