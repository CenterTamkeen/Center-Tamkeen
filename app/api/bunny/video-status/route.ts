import { NextResponse } from "next/server";

import { getBunnyStreamVideoStatus } from "@/lib/bunny-stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID." }, { status: 400 });
  }

  const status = await getBunnyStreamVideoStatus(videoId);

  return NextResponse.json(status);
}
