import { NextResponse } from "next/server";

import { createBunnyStreamTusUploadCredentials } from "@/lib/bunny-stream";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { courseId, title } = (await request.json()) as {
    courseId?: string;
    title?: string;
  };

  if (!courseId || !title?.trim()) {
    return NextResponse.json(
      { error: "Invalid upload request." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!teacher) {
    return NextResponse.json(
      { error: "Teacher profile not found." },
      { status: 403 },
    );
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("teacher_id", teacher.id)
    .maybeSingle();

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  try {
    const credentials = await createBunnyStreamTusUploadCredentials(
      title.trim(),
    );
    return NextResponse.json(credentials);
  } catch {
    return NextResponse.json(
      { error: "Failed to prepare Bunny upload." },
      { status: 500 },
    );
  }
}
