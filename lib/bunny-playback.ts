import { buildBunnyStreamEmbedUrl } from "@/lib/bunny-stream";
import { createClient } from "@/lib/supabase/server";

export async function getAuthorizedBunnyLessonVideo(lessonId: string) {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, bunny_video_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson?.bunny_video_id) {
    return null;
  }

  return {
    lessonId: lesson.id,
    videoId: lesson.bunny_video_id,
  };
}

export async function getAuthorizedBunnyPlaybackUrl(lessonId: string) {
  const video = await getAuthorizedBunnyLessonVideo(lessonId);

  if (!video) {
    return null;
  }

  const embedUrl = buildBunnyStreamEmbedUrl(video.videoId);

  if (!embedUrl) {
    return null;
  }

  return {
    ...video,
    embedUrl,
  };
}
