"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTeacher } from "@/lib/teacher/data";
import { notificationCreateSchema } from "@/lib/validations/notification";
import type { Database } from "@/types/database";

type StudentGrade = Database["public"]["Enums"]["student_grade"];
type StudentSection = Database["public"]["Enums"]["student_section"];

function failure(
  message: string,
  fieldErrors?: Record<string, string[]>,
  values?: Record<string, string>,
): ActionState {
  return {
    status: "error",
    message,
    fieldErrors,
    values,
  };
}

function success(message: string): ActionState {
  return {
    status: "success",
    message,
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFormValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, getString(formData, key)]));
}

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }) {
  return error.flatten().fieldErrors as Record<string, string[]>;
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

function uniqueProfileIds(profileIds: Array<string | null | undefined>) {
  return Array.from(new Set(profileIds.filter(Boolean))) as string[];
}

function revalidateNotificationPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/admin/notifications");
  revalidatePath("/dashboard/teacher/notifications");
}

async function getCourseStudentProfileIds(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("student:students(profile_id)")
    .eq("course_id", courseId);

  if (error) {
    throw new Error(error.message);
  }

  return uniqueProfileIds((data ?? []).map((item) => item.student?.profile_id));
}

async function getAdminRecipientProfileIds(input: {
  targetMode: string;
  grade?: string;
  section?: string;
  courseId?: string;
}) {
  const supabase = await createClient();

  if (input.targetMode === "course" && input.courseId) {
    return getCourseStudentProfileIds(input.courseId);
  }

  let query = supabase.from("students").select("profile_id");

  if (input.targetMode === "grade_section") {
    query = query.eq("grade", input.grade as StudentGrade);

    if (input.section) {
      query = query.eq("section", input.section as StudentSection);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return uniqueProfileIds((data ?? []).map((student) => student.profile_id));
}

async function getTeacherRecipientProfileIds(input: {
  teacherId: string;
  targetMode: string;
  courseId?: string;
}) {
  const supabase = await createClient();

  if (input.targetMode === "course") {
    if (!input.courseId) {
      return [];
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", input.courseId)
      .eq("teacher_id", input.teacherId)
      .maybeSingle();

    if (courseError) {
      throw new Error(courseError.message);
    }

    if (!course) {
      return [];
    }

    return getCourseStudentProfileIds(input.courseId);
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("student:students(profile_id), course:courses!inner(teacher_id)")
    .eq("course.teacher_id", input.teacherId);

  if (error) {
    throw new Error(error.message);
  }

  return uniqueProfileIds((data ?? []).map((item) => item.student?.profile_id));
}

/**
 * Mark all unread notifications as read for the current user.
 * Sets `read_at` to `now()` on every notification where `read_at IS NULL`.
 */
export async function markNotificationsAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_profile_id", user.id)
    .is("read_at", null);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications:markAsRead]", error.message);
    }
    return;
  }

  revalidatePath("/", "layout");
}

export async function createStudentNotificationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "title",
    "body",
    "href",
    "targetMode",
    "grade",
    "section",
    "courseId",
  ]);
  const session = await getCurrentUserProfile();

  if (!session) {
    return failure("لازم تسجل الدخول الأول.", undefined, values);
  }

  if (session.profile.role !== "admin" && session.profile.role !== "teacher") {
    return failure(
      "إرسال الإشعارات متاح للأدمن والمدرس فقط.",
      undefined,
      values,
    );
  }

  const parsed = notificationCreateSchema.safeParse({
    title: getString(formData, "title"),
    body: getString(formData, "body"),
    href: getString(formData, "href"),
    targetMode: getString(formData, "targetMode"),
    grade: getString(formData, "grade"),
    section: getString(formData, "section"),
    courseId: getString(formData, "courseId"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الإشعار.", fieldErrors(parsed.error), values);
  }

  let recipientProfileIds: string[];

  try {
    if (session.profile.role === "admin") {
      recipientProfileIds = await getAdminRecipientProfileIds(parsed.data);
    } else {
      const teacher = await getCurrentTeacher(session.profile.id);

      if (!teacher) {
        return failure("لا يوجد ملف مدرس مرتبط بحسابك.", undefined, values);
      }

      if (
        parsed.data.targetMode !== "course" &&
        parsed.data.targetMode !== "teacher_students"
      ) {
        return failure("المدرس يقدر يرسل لطلابه فقط.", undefined, values);
      }

      recipientProfileIds = await getTeacherRecipientProfileIds({
        teacherId: teacher.id,
        targetMode: parsed.data.targetMode,
        courseId: parsed.data.courseId,
      });
    }
  } catch {
    return failure("تعذر تحديد الطلاب المستهدفين.", undefined, values);
  }

  if (recipientProfileIds.length === 0) {
    return failure("لا يوجد طلاب مطابقين للاختيار الحالي.", undefined, values);
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return failure("إعدادات إرسال الإشعارات غير مكتملة.", undefined, values);
  }

  const admin = createAdminClient();
  const courseId =
    parsed.data.targetMode === "course" && parsed.data.courseId
      ? parsed.data.courseId
      : null;
  const rows = recipientProfileIds.map((recipientProfileId) => ({
    recipient_profile_id: recipientProfileId,
    actor_profile_id: session.profile.id,
    course_id: courseId,
    title: parsed.data.title,
    body: parsed.data.body,
    href: parsed.data.href,
    kind: "manual",
  }));
  let { error } = await admin.from("notifications").insert(rows);

  if (error && isMissingNotificationCourseId(error)) {
    const legacyRows = rows.map((row) => ({
      recipient_profile_id: row.recipient_profile_id,
      actor_profile_id: row.actor_profile_id,
      title: row.title,
      body: row.body,
      href: row.href,
      kind: row.kind,
    }));
    const legacyInsert = await admin.from("notifications").insert(legacyRows);
    error = legacyInsert.error;
  }

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications:createStudentNotification]", error.message);
    }

    return failure("تعذر إرسال الإشعار.", undefined, values);
  }

  revalidateNotificationPaths();
  return success(
    `تم إرسال الإشعار إلى ${recipientProfileIds.length.toLocaleString("ar-EG")} طالب.`,
  );
}
