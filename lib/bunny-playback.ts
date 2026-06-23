import { buildBunnyStreamEmbedUrl } from "@/lib/bunny-stream";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildYouTubeEmbedUrl } from "@/lib/youtube";

const STUDENT_LESSON_PLAYBACK_LIMIT = 3;

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

export async function getAuthorizedLessonPlaybackUrl(lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      "id, bunny_video_id, youtube_video_id, course_id, is_free_preview, video_provider",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson) {
    return null;
  }

  if (!lesson.is_free_preview) {
    const isAllowed = await canWatchCourseVideo(lesson.course_id, user.id);

    if (!isAllowed) {
      return null;
    }
  }

  const provider = lesson.video_provider === "youtube" ? "youtube" : "bunny";

  const embedUrl =
    provider === "youtube"
      ? buildYouTubeEmbedUrl(lesson.youtube_video_id)
      : buildBunnyStreamEmbedUrl(lesson.bunny_video_id);

  if (!embedUrl) {
    return null;
  }

  let playbackCount: number | null = null;
  let remainingPlaybacks: number | null = null;

  if (!lesson.is_free_preview) {
    const playbackAccess = await recordStudentLessonPlayback({
      courseId: lesson.course_id,
      lessonId: lesson.id,
      userId: user.id,
    });

    if (playbackAccess?.allowed === false) {
      return {
        deniedReason: "playback_limit_reached" as const,
        playbackCount: playbackAccess.playbackCount,
        playbackLimit: STUDENT_LESSON_PLAYBACK_LIMIT,
      };
    }

    if (playbackAccess) {
      playbackCount = playbackAccess.playbackCount;
      remainingPlaybacks = Math.max(
        0,
        STUDENT_LESSON_PLAYBACK_LIMIT - playbackAccess.playbackCount,
      );
    }
  }

  return {
    lessonId: lesson.id,
    videoId:
      provider === "youtube" ? lesson.youtube_video_id : lesson.bunny_video_id,
    courseId: lesson.course_id,
    isFreePreview: lesson.is_free_preview,
    provider,
    embedUrl,
    playbackCount,
    playbackLimit: STUDENT_LESSON_PLAYBACK_LIMIT,
    remainingPlaybacks,
  };
}

async function recordStudentLessonPlayback({
  courseId,
  lessonId,
  userId,
}: {
  courseId: string;
  lessonId: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "student") {
    return null;
  }

  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!student) {
    return null;
  }

  const { data, error } = await admin.rpc("record_lesson_playback", {
    student_uuid: student.id,
    course_uuid: courseId,
    lesson_uuid: lessonId,
    max_playbacks: STUDENT_LESSON_PLAYBACK_LIMIT,
  });

  if (error) {
    return null;
  }

  const result = data?.[0];

  if (!result) {
    return null;
  }

  return {
    allowed: result.allowed,
    playbackCount: result.playback_count,
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
      const admin = createAdminClient();
      const { data: student } = await admin
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!student) {
        return null;
      }

      const { data: canAccess, error: accessError } = await admin.rpc(
        "can_access_course",
        {
          course_uuid: video.courseId,
          student_uuid: student.id,
        },
      );

      if (accessError || !canAccess) {
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

async function canWatchCourseVideo(courseId: string, userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  if (profile.role === "teacher") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (!teacher) {
      return false;
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("teacher_id", teacher.id)
      .maybeSingle();

    return Boolean(course);
  }

  if (profile.role === "student") {
    const admin = createAdminClient();
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (!student) {
      return false;
    }

    const { data, error } = await admin.rpc("can_access_course", {
      course_uuid: courseId,
      student_uuid: student.id,
    });

    return !error && Boolean(data);
  }

  return false;
}
