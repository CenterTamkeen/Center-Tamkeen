"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { requireRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

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

function success(
  message: string,
  values?: Record<string, string>,
): ActionState {
  return {
    status: "success",
    message,
    values,
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function getStudentAndCourse(profileId: string, courseId: string) {
  const admin = getAdminClient();

  if (!admin) {
    return {
      error: "إعدادات السيرفر غير مكتملة.",
      student: null,
      course: null,
      admin: null,
    };
  }

  const [{ data: student }, { data: course }] = await Promise.all([
    admin
      .from("students")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle(),
    admin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  if (!student) {
    return {
      error: "لا يوجد ملف طالب مرتبط بالحساب.",
      student: null,
      course: null,
      admin,
    };
  }

  if (!course) {
    return {
      error: "الكورس غير موجود أو غير متاح.",
      student,
      course: null,
      admin,
    };
  }

  return {
    error: null,
    student: student as StudentRow,
    course: course as CourseRow,
    admin,
  };
}

export async function redeemCourseActivationCodeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole("student", "/dashboard/student");
  const courseId = getString(formData, "courseId");
  const activationCode = getString(formData, "activationCode").replace(
    /\D/g,
    "",
  );
  const context = await getStudentAndCourse(profile.id, courseId);

  if (context.error || !context.student || !context.course || !context.admin) {
    return failure(context.error ?? "تعذر تجهيز بيانات التفعيل.");
  }

  if (!/^[0-9]{6}$/.test(activationCode)) {
    return failure(
      "كود التفعيل لازم يكون ٦ أرقام.",
      { activationCode: ["كود التفعيل لازم يكون ٦ أرقام."] },
      { courseId, activationCode },
    );
  }

  const { data, error } = await context.admin.rpc(
    "redeem_course_activation_code",
    {
      course_uuid: context.course.id,
      submitted_code: activationCode,
      student_uuid: context.student.id,
    },
  );

  if (error) {
    console.error("Failed to redeem activation code.", error);
    return failure(
      "تعذر تفعيل الكود. تأكد من تطبيق آخر migration.",
      undefined,
      { courseId, activationCode },
    );
  }

  const result = data?.[0];

  if (!result || result.status !== "success") {
    return failure(
      result?.message ?? "الكود غير صالح.",
      { activationCode: [result?.message ?? "الكود غير صالح."] },
      { courseId, activationCode },
    );
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/activation-codes");
  revalidatePath("/dashboard/admin/reports");

  return success(result.message, {
    courseId,
    enrollmentId: result.enrollment_id ?? "",
    orderId: result.order_id ?? "",
  });
}
