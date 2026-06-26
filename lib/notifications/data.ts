import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NotificationItem =
  Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationCourseOption = {
  id: string;
  title: string;
  teacherName?: string | null;
  enrollmentCount: number;
};

function logNotificationError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[notifications:${label}]`, error);
  }
}

function isMissingNotificationsTable(error: {
  message?: string;
  code?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("notifications") ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find")
  );
}

function isMissingNotificationCourseId(error: {
  message?: string;
  code?: string;
}) {
  return (
    error.code === "PGRST204" ||
    error.message?.includes("course_id") ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find")
  );
}

export async function getProfileNotifications(profileId: string, limit = 6) {
  const supabase = await createClient();
  const fullQuery = await supabase
    .from("notifications")
    .select(
      "id, recipient_profile_id, actor_profile_id, course_id, title, body, href, kind, read_at, created_at",
    )
    .eq("recipient_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);
  let data: unknown[] | null = fullQuery.data;
  let error = fullQuery.error;

  if (error && isMissingNotificationCourseId(error)) {
    const legacyQuery = await supabase
      .from("notifications")
      .select(
        "id, recipient_profile_id, actor_profile_id, title, body, href, kind, read_at, created_at",
      )
      .eq("recipient_profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    data = legacyQuery.data;
    error = legacyQuery.error;
  }

  if (error) {
    if (!isMissingNotificationsTable(error)) {
      logNotificationError("list", error.message);
    }

    return [] as NotificationItem[];
  }

  return (data ?? []) as NotificationItem[];
}

export async function getAdminNotificationCourses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, teacher:teachers(profile:profiles(full_name)), enrollments(id)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logNotificationError("admin-course-options", error.message);
    return [] as NotificationCourseOption[];
  }

  return (data ?? []).map((course) => ({
    id: course.id,
    title: course.title,
    teacherName: course.teacher?.profile?.full_name ?? null,
    enrollmentCount: course.enrollments?.length ?? 0,
  }));
}

export async function getTeacherNotificationCourses(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, enrollments(id)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    logNotificationError("teacher-course-options", error.message);
    return [] as NotificationCourseOption[];
  }

  return (data ?? []).map((course) => ({
    id: course.id,
    title: course.title,
    enrollmentCount: course.enrollments?.length ?? 0,
  }));
}
