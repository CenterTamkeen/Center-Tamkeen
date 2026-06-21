import { buildBunnyStreamEmbedUrl } from "@/lib/bunny-stream";
import { createClient } from "@/lib/supabase/server";

export async function getAuthorizedBunnyLessonVideo(lessonId: string) {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, bunny_video_id, course_id, is_free_preview")
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson?.bunny_video_id) {
    return null;
  }

  return {
    lessonId: lesson.id,
    videoId: lesson.bunny_video_id,
    courseId: lesson.course_id,
    isFreePreview: lesson.is_free_preview,
  };
}

/**
 * Returns a playback URL only if the current user is authorized to watch.
 *
 * Authorization rules:
 * - Free-preview lessons: any authenticated user.
 * - Admin: always allowed.
 * - Teacher: allowed if they own the course.
 * - Student: allowed only with an active enrollment in the course.
 */
export async function getAuthorizedBunnyPlaybackUrl(lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const video = await getAuthorizedBunnyLessonVideo(lessonId);

  if (!video) {
    return null;
  }

  // Free preview lessons are open to any authenticated user.
  if (!video.isFreePreview) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return null;
    }

    if (profile.role === "teacher") {
      // Teachers can only watch their own course videos.
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!teacher) {
        return null;
      }

      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("id", video.courseId)
        .eq("teacher_id", teacher.id)
        .maybeSingle();

      if (!course) {
        return null;
      }
    } else if (profile.role === "student") {
      // Students must be enrolled in the course.
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!student) {
        return null;
      }

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", student.id)
        .eq("course_id", video.courseId)
        .maybeSingle();

      if (!enrollment) {
        return null;
      }
    }
    // Admin role: always allowed (no extra check needed).
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
