import { NextResponse } from "next/server";

import { getAuthorizedBunnyLessonVideo } from "@/lib/bunny-playback";
import { getBunnyStreamVideoStatus } from "@/lib/bunny-stream";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  const videoId = searchParams.get("videoId");

  if (lessonId) {
    const video = await getAuthorizedBunnyLessonVideo(lessonId);

    if (!video) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const status = await getBunnyStreamVideoStatus(video.videoId);
    return NextResponse.json(status);
  }

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing lesson or video ID." },
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const status = await getBunnyStreamVideoStatus(videoId);

  return NextResponse.json(status);
}
