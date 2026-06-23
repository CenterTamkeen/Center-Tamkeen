import { NextResponse } from "next/server";

import { getAuthorizedLessonPlaybackUrl } from "@/lib/bunny-playback";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) {
    return NextResponse.json({ error: "Missing lesson ID." }, { status: 400 });
  }

  const playback = await getAuthorizedLessonPlaybackUrl(lessonId);

  if (!playback) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ embedUrl: playback.embedUrl });
}
