"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { requireRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCourseHref } from "@/lib/storefront/links";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type ActivationCourseLookup = Pick<
  CourseRow,
  "id" | "title" | "is_published"
> & {
  teacher:
    | {
        slug: string | null;
        is_active: boolean;
      }
    | {
        slug: string | null;
        is_active: boolean;
      }[]
    | null;
};

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

function normalizeActivationCode(value: string) {
  return value.replace(/\D/g, "");
}

function getCourseTeacher(course: ActivationCourseLookup) {
  return Array.isArray(course.teacher) ? course.teacher[0] : course.teacher;
}

function getActivationCourseHref(course: ActivationCourseLookup) {
  const teacher = getCourseTeacher(course);

  return buildCourseHref({
    id: course.id,
    teacher: {
      slug: teacher?.slug ?? null,
    },
  });
}

function revalidateActivationPaths(courseId?: string, courseHref?: string) {
  revalidatePath("/");
  revalidatePath("/courses");

  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
  }

  if (courseHref?.startsWith("/courses/")) {
    revalidatePath(courseHref);
  }

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/activation-codes");
  revalidatePath("/dashboard/admin/reports");
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
  const activationCode = normalizeActivationCode(
    getString(formData, "activationCode"),
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

  revalidateActivationPaths(context.course.id);

  return success(result.message, {
    courseId,
    enrollmentId: result.enrollment_id ?? "",
    orderId: result.order_id ?? "",
  });
}

export async function redeemAnyCourseActivationCodeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole("student", "/dashboard/student");
  const activationCode = normalizeActivationCode(
    getString(formData, "activationCode"),
  );
  const values = { activationCode };

  if (!/^[0-9]{6}$/.test(activationCode)) {
    return failure(
      "كود التفعيل لازم يكون ٦ أرقام.",
      { activationCode: ["كود التفعيل لازم يكون ٦ أرقام."] },
      values,
    );
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure("إعدادات السيرفر غير مكتملة.", undefined, values);
  }

  const [{ data: student }, { data: codeRow, error: codeError }] =
    await Promise.all([
      admin
        .from("students")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle(),
      admin
        .from("activation_codes")
        .select("course_id, used_at, expires_at")
        .eq("code", activationCode)
        .maybeSingle(),
    ]);

  if (!student) {
    return failure("لا يوجد ملف طالب مرتبط بالحساب.", undefined, values);
  }

  if (codeError) {
    console.error("Failed to find activation code.", codeError);
    return failure(
      "تعذر مراجعة كود التفعيل. حاول مرة تانية.",
      undefined,
      values,
    );
  }

  if (!codeRow) {
    return failure(
      "الكود غير صحيح أو غير موجود.",
      { activationCode: ["الكود غير صحيح أو غير موجود."] },
      values,
    );
  }

  const { data: courseData, error: courseError } = await admin
    .from("courses")
    .select("id, title, is_published, teacher:teachers(slug, is_active)")
    .eq("id", codeRow.course_id)
    .maybeSingle();
  const course = courseData as ActivationCourseLookup | null;

  if (courseError || !course) {
    console.error("Failed to load activation course.", courseError);
    return failure("الكورس المرتبط بالكود غير موجود.", undefined, values);
  }

  const teacher = getCourseTeacher(course);
  const courseHref = getActivationCourseHref(course);
  const courseValues = {
    ...values,
    courseId: course.id,
    courseTitle: course.title,
    courseHref,
  };

  if (!course.is_published || !teacher?.is_active) {
    return failure(
      "الكورس المرتبط بالكود غير متاح حاليًا.",
      undefined,
      courseValues,
    );
  }

  if (codeRow.used_at) {
    return failure(
      "الكود تم استخدامه قبل كده.",
      { activationCode: ["الكود تم استخدامه قبل كده."] },
      courseValues,
    );
  }

  if (new Date(codeRow.expires_at) <= new Date()) {
    return failure(
      "صلاحية الكود انتهت.",
      { activationCode: ["صلاحية الكود انتهت."] },
      courseValues,
    );
  }

  const { data, error } = await admin.rpc("redeem_course_activation_code", {
    course_uuid: course.id,
    submitted_code: activationCode,
    student_uuid: student.id,
  });

  if (error) {
    console.error("Failed to redeem activation code from navbar.", error);
    return failure(
      "تعذر تفعيل الكود. تأكد من تطبيق آخر migration.",
      undefined,
      courseValues,
    );
  }

  const result = data?.[0];

  if (!result || result.status !== "success") {
    return failure(
      result?.message ?? "الكود غير صالح.",
      { activationCode: [result?.message ?? "الكود غير صالح."] },
      {
        ...courseValues,
        enrollmentId: result?.enrollment_id ?? "",
        orderId: result?.order_id ?? "",
      },
    );
  }

  revalidateActivationPaths(course.id, courseHref);

  return success(`تم تفعيل ${course.title} بنجاح.`, {
    ...courseValues,
    enrollmentId: result.enrollment_id ?? "",
    orderId: result.order_id ?? "",
  });
}

export async function submitCourseReviewAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole("student", "/dashboard/student");
  const courseId = getString(formData, "courseId");
  const courseHref = getString(formData, "courseHref");
  const ratingValue = Number(getString(formData, "rating"));
  const comment = getString(formData, "comment");
  const values = {
    courseId,
    courseHref,
    rating: Number.isFinite(ratingValue) ? String(ratingValue) : "",
    comment,
  };

  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return failure(
      "اختار عدد النجوم من ١ لـ ٥.",
      { rating: ["اختار تقييم صحيح من ١ لـ ٥ نجوم."] },
      values,
    );
  }

  if (comment.length > 800) {
    return failure(
      "التعليق طويل جدًا.",
      { comment: ["التعليق لا يزيد عن ٨٠٠ حرف."] },
      values,
    );
  }

  const context = await getStudentAndCourse(profile.id, courseId);

  if (context.error || !context.student || !context.course || !context.admin) {
    return failure(
      context.error ?? "تعذر تجهيز بيانات التقييم.",
      undefined,
      values,
    );
  }

  const { data: enrollment } = await context.admin
    .from("enrollments")
    .select("id")
    .eq("student_id", context.student.id)
    .eq("course_id", context.course.id)
    .maybeSingle();

  if (!enrollment) {
    return failure(
      "التقييم متاح فقط للطلاب المشتركين في الكورس.",
      undefined,
      values,
    );
  }

  const { data: existingReview } = await context.admin
    .from("reviews")
    .select("id")
    .eq("student_id", context.student.id)
    .eq("course_id", context.course.id)
    .maybeSingle();
  const reviewPayload = {
    rating: ratingValue,
    comment: comment.length > 0 ? comment : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = existingReview
    ? await context.admin
        .from("reviews")
        .update(reviewPayload)
        .eq("id", existingReview.id)
        .eq("student_id", context.student.id)
    : await context.admin.from("reviews").insert({
        ...reviewPayload,
        student_id: context.student.id,
        course_id: context.course.id,
      });

  if (error) {
    console.error("Failed to submit course review.", error);
    return failure("تعذر حفظ التقييم. حاول مرة تانية.", undefined, values);
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${context.course.id}`);

  if (courseHref.startsWith("/courses/")) {
    revalidatePath(courseHref);
  }

  return success("تم حفظ تقييمك للكورس.", {
    courseId,
    courseHref,
    rating: String(ratingValue),
    comment,
  });
}

export async function deleteCourseReviewAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole("student", "/dashboard/student");
  const courseId = getString(formData, "courseId");
  const courseHref = getString(formData, "courseHref");
  const context = await getStudentAndCourse(profile.id, courseId);

  if (context.error || !context.student || !context.course || !context.admin) {
    return failure(context.error ?? "تعذر تجهيز بيانات التقييم.", undefined, {
      courseId,
      courseHref,
    });
  }

  const { data: review } = await context.admin
    .from("reviews")
    .select("id")
    .eq("student_id", context.student.id)
    .eq("course_id", context.course.id)
    .maybeSingle();

  if (!review) {
    return failure("لا يوجد تقييم لحذفه.", undefined, { courseId, courseHref });
  }

  const { error } = await context.admin
    .from("reviews")
    .delete()
    .eq("id", review.id)
    .eq("student_id", context.student.id);

  if (error) {
    console.error("Failed to delete course review.", error);
    return failure("تعذر حذف التقييم. حاول مرة تانية.", undefined, {
      courseId,
      courseHref,
    });
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${context.course.id}`);

  if (courseHref.startsWith("/courses/")) {
    revalidatePath(courseHref);
  }

  return success("تم حذف تقييمك.", { courseId, courseHref });
}
