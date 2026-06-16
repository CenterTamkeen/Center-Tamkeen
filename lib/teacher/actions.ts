"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/auth/action-state";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTeacher } from "@/lib/teacher/data";
import {
  couponSchema,
  couponUpdateSchema,
  courseSchema,
  lessonSchema,
  lessonUpdateSchema,
} from "@/lib/validations/teacher";
import type { Database } from "@/types/database";

type DiscountType = Database["public"]["Enums"]["discount_type"];
type CouponInsert = Database["public"]["Tables"]["coupons"]["Insert"];
type CouponUpdate = Database["public"]["Tables"]["coupons"]["Update"];

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

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value.length > 0 ? value : undefined;
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getOptionalUpload(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

function getFormValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, getString(formData, key)]));
}

function getListFromCsv(formData: FormData, key: string) {
  return getString(formData, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function getFileExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function isMissingCouponTargetColumn(error: {
  message: string;
  code?: string;
}) {
  return (
    error.code === "PGRST204" ||
    error.message.includes("target_student_id") ||
    error.message.includes("course_id") ||
    error.message.includes("coupon_student_targets") ||
    error.message.includes("schema cache")
  );
}

function couponFailureMessage(error: { message: string; code?: string }) {
  if (error.code === "23505" || error.message.includes("duplicate key")) {
    return {
      message: "الكود ده مستخدم قبل كده.",
      fieldErrors: { code: ["اختار كود مختلف، الكود الحالي موجود بالفعل."] },
    };
  }

  if (isMissingCouponTargetColumn(error)) {
    return {
      message:
        "تحديث قاعدة البيانات الخاص بالكوبونات المخصصة لسه متطبقش. طبق آخر migration وجرب تاني.",
      fieldErrors: undefined,
    };
  }

  return {
    message: "تعذر إنشاء الكوبون. راجع البيانات وحاول مرة تانية.",
    fieldErrors: undefined,
  };
}

async function requireTeacher() {
  const { profile } = await requireRole("teacher", "/dashboard/teacher");
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    throw new Error("لا يوجد ملف مدرس مرتبط بهذا الحساب.");
  }

  return {
    profile,
    teacher,
  };
}

async function uploadThumbnail(teacherId: string, file?: File) {
  if (!file) {
    return null;
  }

  const supabase = await createClient();
  const path = `${teacherId}/course-${Date.now()}.${getFileExtension(file)}`;
  const { error } = await supabase.storage
    .from("thumbnails")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("thumbnails").getPublicUrl(path);
  return data.publicUrl;
}

async function assertOwnsCourse(teacherId: string, courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("id", courseId)
    .maybeSingle();

  return Boolean(data);
}

async function assertTeacherStudents(teacherId: string, studentIds: string[]) {
  if (studentIds.length === 0) {
    return true;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("student_id, course:courses!inner(teacher_id)")
    .in("student_id", studentIds)
    .eq("course.teacher_id", teacherId);
  const foundIds = new Set((data ?? []).map((item) => item.student_id));

  return studentIds.every((studentId) => foundIds.has(studentId));
}

export async function createCourseAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, ["title", "description", "price"]);
  let teacherId = "";

  try {
    const { teacher } = await requireTeacher();
    teacherId = teacher.id;
  } catch {
    return failure("لازم تكون داخل بحساب مدرس.");
  }

  const parsed = courseSchema.safeParse({
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    price: getString(formData, "price"),
    thumbnail: getOptionalUpload(formData, "thumbnail"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الكورس.", fieldErrors(parsed.error), values);
  }

  let thumbnailUrl: string | null = null;

  try {
    thumbnailUrl = await uploadThumbnail(teacherId, parsed.data.thumbnail);
  } catch {
    return failure(
      "تعذر رفع الصورة المصغّرة.",
      { thumbnail: ["تعذر رفع الصورة المصغّرة."] },
      values,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert({
    teacher_id: teacherId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    price: parsed.data.price,
    thumbnail_url: thumbnailUrl,
    is_published: false,
  });

  if (error) {
    return failure(
      "تعذر إنشاء الكورس. تأكد من صلاحيات حساب المدرس.",
      undefined,
      values,
    );
  }

  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/teacher/courses");
  redirect("/dashboard/teacher/courses");
}

export async function updateCourseAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const courseId = getString(formData, "courseId");
  const values = getFormValues(formData, ["title", "description", "price"]);
  const { teacher } = await requireTeacher();

  if (!(await assertOwnsCourse(teacher.id, courseId))) {
    return failure("الكورس غير موجود أو ليس من كورساتك.");
  }

  const parsed = courseSchema.safeParse({
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    price: getString(formData, "price"),
    thumbnail: getOptionalUpload(formData, "thumbnail"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الكورس.", fieldErrors(parsed.error), values);
  }

  let thumbnailUrl: string | null = null;

  try {
    thumbnailUrl = await uploadThumbnail(teacher.id, parsed.data.thumbnail);
  } catch {
    return failure(
      "تعذر رفع الصورة المصغّرة.",
      { thumbnail: ["تعذر رفع الصورة المصغّرة."] },
      values,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      price: parsed.data.price,
      ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
    })
    .eq("id", courseId)
    .eq("teacher_id", teacher.id);

  if (error) {
    return failure("تعذر حفظ تعديلات الكورس.", undefined, values);
  }

  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/teacher/courses");
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
  return success("تم حفظ تعديلات الكورس.");
}

export async function toggleCoursePublishAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const nextPublished = getCheckbox(formData, "nextPublished");
  const { teacher } = await requireTeacher();
  const supabase = await createClient();

  await supabase
    .from("courses")
    .update({ is_published: nextPublished })
    .eq("id", courseId)
    .eq("teacher_id", teacher.id);

  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/teacher/courses");
}

export async function deleteCourseAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const { teacher } = await requireTeacher();
  const supabase = await createClient();

  await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("teacher_id", teacher.id);

  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/teacher/courses");
}

export async function createLessonAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const courseId = getString(formData, "courseId");
  const values = getFormValues(formData, [
    "courseId",
    "title",
    "vdocipherVideoId",
    "durationMinutes",
  ]);
  const { teacher } = await requireTeacher();

  if (!(await assertOwnsCourse(teacher.id, courseId))) {
    return failure("الكورس غير موجود أو ليس من كورساتك.");
  }

  const parsed = lessonSchema.safeParse({
    courseId,
    title: getString(formData, "title"),
    vdocipherVideoId: getOptionalString(formData, "vdocipherVideoId"),
    durationMinutes: getOptionalString(formData, "durationMinutes") ?? 0,
    isFreePreview: getCheckbox(formData, "isFreePreview"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الحصة.", fieldErrors(parsed.error), values);
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  const { error } = await supabase.from("lessons").insert({
    course_id: courseId,
    title: parsed.data.title,
    order_index: count ?? 0,
    vdocipher_video_id: parsed.data.vdocipherVideoId || null,
    duration: parsed.data.durationMinutes
      ? Math.round(parsed.data.durationMinutes * 60)
      : null,
    is_free_preview: parsed.data.isFreePreview ?? false,
  });

  if (error) {
    return failure("تعذر إضافة الحصة.", undefined, values);
  }

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
  return success("تمت إضافة الحصة.");
}

export async function updateLessonAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const courseId = getString(formData, "courseId");
  const values = getFormValues(formData, [
    "lessonId",
    "courseId",
    "title",
    "vdocipherVideoId",
    "durationMinutes",
  ]);
  const { teacher } = await requireTeacher();

  if (!(await assertOwnsCourse(teacher.id, courseId))) {
    return failure("الكورس غير موجود أو ليس من كورساتك.");
  }

  const parsed = lessonUpdateSchema.safeParse({
    lessonId: getString(formData, "lessonId"),
    courseId,
    title: getString(formData, "title"),
    vdocipherVideoId: getOptionalString(formData, "vdocipherVideoId"),
    durationMinutes: getOptionalString(formData, "durationMinutes") ?? 0,
    isFreePreview: getCheckbox(formData, "isFreePreview"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الحصة.", fieldErrors(parsed.error), values);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      title: parsed.data.title,
      vdocipher_video_id: parsed.data.vdocipherVideoId || null,
      duration: parsed.data.durationMinutes
        ? Math.round(parsed.data.durationMinutes * 60)
        : null,
      is_free_preview: parsed.data.isFreePreview ?? false,
    })
    .eq("id", parsed.data.lessonId)
    .eq("course_id", courseId);

  if (error) {
    return failure("تعذر حفظ الحصة.", undefined, values);
  }

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
  return success("تم حفظ الحصة.");
}

export async function deleteLessonAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const { teacher } = await requireTeacher();

  if (!(await assertOwnsCourse(teacher.id, courseId))) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId)
    .eq("course_id", courseId);

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
}

export async function moveLessonAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const direction = getString(formData, "direction");
  const { teacher } = await requireTeacher();

  if (!(await assertOwnsCourse(teacher.id, courseId))) {
    return;
  }

  const supabase = await createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  const ordered = lessons ?? [];
  const currentIndex = ordered.findIndex((lesson) => lesson.id === lessonId);
  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || swapIndex < 0 || swapIndex >= ordered.length) {
    return;
  }

  const current = ordered[currentIndex];
  const swap = ordered[swapIndex];

  await Promise.all([
    supabase
      .from("lessons")
      .update({ order_index: swap.order_index })
      .eq("id", current.id),
    supabase
      .from("lessons")
      .update({ order_index: current.order_index })
      .eq("id", swap.id),
  ]);

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
}

export async function reorderLessonsAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const lessonIds = getListFromCsv(formData, "lessonIds");
  const { teacher } = await requireTeacher();

  if (
    !(await assertOwnsCourse(teacher.id, courseId)) ||
    lessonIds.length === 0
  ) {
    return;
  }

  const supabase = await createClient();
  await Promise.all(
    lessonIds.map((lessonId, index) =>
      supabase
        .from("lessons")
        .update({ order_index: index })
        .eq("id", lessonId)
        .eq("course_id", courseId),
    ),
  );

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
}

export async function duplicateLessonAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const { teacher } = await requireTeacher();

  if (!(await assertOwnsCourse(teacher.id, courseId))) {
    return;
  }

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, vdocipher_video_id, duration, is_free_preview")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .maybeSingle();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (!lesson) {
    return;
  }

  await supabase.from("lessons").insert({
    course_id: courseId,
    title: `${lesson.title} - نسخة`,
    order_index: count ?? 0,
    vdocipher_video_id: lesson.vdocipher_video_id,
    duration: lesson.duration,
    is_free_preview: lesson.is_free_preview,
  });

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
}

export async function bulkDeleteLessonsAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const lessonIds = getListFromCsv(formData, "lessonIds");
  const { teacher } = await requireTeacher();

  if (
    !(await assertOwnsCourse(teacher.id, courseId)) ||
    lessonIds.length === 0
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("lessons")
    .delete()
    .eq("course_id", courseId)
    .in("id", lessonIds);

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
}

export async function moveLessonToCourseAction(formData: FormData) {
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const targetCourseId = getString(formData, "targetCourseId");
  const { teacher } = await requireTeacher();

  if (
    !(await assertOwnsCourse(teacher.id, courseId)) ||
    !(await assertOwnsCourse(teacher.id, targetCourseId))
  ) {
    return;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", targetCourseId);

  await supabase
    .from("lessons")
    .update({
      course_id: targetCourseId,
      order_index: count ?? 0,
    })
    .eq("id", lessonId)
    .eq("course_id", courseId);

  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons`);
  revalidatePath(`/dashboard/teacher/courses/${targetCourseId}/lessons`);
}

export async function createCouponAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "code",
    "discountType",
    "discountValue",
    "courseId",
    "usageLimit",
    "targetStudentIds",
    "expiresAt",
  ]);
  const { teacher } = await requireTeacher();
  const restrictToStudent = getCheckbox(formData, "restrictToStudent");
  const targetStudentIds = restrictToStudent
    ? getListFromCsv(formData, "targetStudentIds")
    : [];
  const parsed = couponSchema.safeParse({
    code: getString(formData, "code").toUpperCase(),
    discountType: getString(formData, "discountType"),
    discountValue: getString(formData, "discountValue"),
    courseId: getString(formData, "courseId"),
    usageLimit: getOptionalString(formData, "usageLimit"),
    targetStudentIds,
    expiresAt: getOptionalString(formData, "expiresAt"),
    isActive: getCheckbox(formData, "isActive"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الكوبون.", fieldErrors(parsed.error), values);
  }

  if (!(await assertOwnsCourse(teacher.id, parsed.data.courseId))) {
    return failure(
      "الكورس غير موجود أو ليس من كورساتك.",
      { courseId: ["اختار كورس من كورساتك."] },
      values,
    );
  }

  if (restrictToStudent && targetStudentIds.length === 0) {
    return failure(
      "اختار الطلاب المخصص لهم الكوبون.",
      { targetStudentIds: ["اختار طالب واحد على الأقل."] },
      values,
    );
  }

  if (
    targetStudentIds.length > 0 &&
    !(await assertTeacherStudents(teacher.id, targetStudentIds))
  ) {
    return failure(
      "فيه طالب مختار غير موجود ضمن طلاب كورساتك.",
      { targetStudentIds: ["اختار طلاب من طلاب كورساتك فقط."] },
      values,
    );
  }

  const supabase = await createClient();
  const couponInsert: CouponInsert = {
    teacher_id: teacher.id,
    course_id: parsed.data.courseId,
    code: parsed.data.code,
    discount_type: parsed.data.discountType as DiscountType,
    discount_value: parsed.data.discountValue,
    usage_limit: parsed.data.usageLimit ?? null,
    target_student_id: null,
    expires_at: parsed.data.expiresAt || null,
    is_active: parsed.data.isActive ?? false,
  };
  let { data: createdCoupon, error } = await supabase
    .from("coupons")
    .insert(couponInsert)
    .select("id")
    .single();

  if (
    error &&
    isMissingCouponTargetColumn(error) &&
    targetStudentIds.length === 0
  ) {
    const legacyCouponInsert: Omit<CouponInsert, "target_student_id"> = {
      teacher_id: couponInsert.teacher_id,
      course_id: couponInsert.course_id,
      code: couponInsert.code,
      discount_type: couponInsert.discount_type,
      discount_value: couponInsert.discount_value,
      usage_limit: couponInsert.usage_limit,
      expires_at: couponInsert.expires_at,
      is_active: couponInsert.is_active,
    };
    const legacyResult = await supabase
      .from("coupons")
      .insert(legacyCouponInsert)
      .select("id")
      .single();
    createdCoupon = legacyResult.data;
    error = legacyResult.error;
  }

  if (error) {
    const couponFailure = couponFailureMessage(error);
    return failure(couponFailure.message, couponFailure.fieldErrors, values);
  }

  if (createdCoupon && targetStudentIds.length > 0) {
    const { error: targetsError } = await supabase
      .from("coupon_student_targets")
      .insert(
        targetStudentIds.map((studentId) => ({
          coupon_id: createdCoupon.id,
          student_id: studentId,
        })),
      );

    if (targetsError) {
      return failure(
        "تم إنشاء الكوبون، لكن تعذر حفظ الطلاب المخصصين. تأكد من تطبيق آخر migration.",
        undefined,
        values,
      );
    }
  }

  revalidatePath("/dashboard/teacher/coupons");
  return success("تم إنشاء الكوبون.");
}

export async function updateCouponAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "couponId",
    "code",
    "discountType",
    "discountValue",
    "courseId",
    "usageLimit",
    "targetStudentIds",
    "expiresAt",
  ]);
  const { teacher } = await requireTeacher();
  const restrictToStudent = getCheckbox(formData, "restrictToStudent");
  const targetStudentIds = restrictToStudent
    ? getListFromCsv(formData, "targetStudentIds")
    : [];
  const parsed = couponUpdateSchema.safeParse({
    couponId: getString(formData, "couponId"),
    code: getString(formData, "code").toUpperCase(),
    discountType: getString(formData, "discountType"),
    discountValue: getString(formData, "discountValue"),
    courseId: getString(formData, "courseId"),
    usageLimit: getOptionalString(formData, "usageLimit"),
    targetStudentIds,
    expiresAt: getOptionalString(formData, "expiresAt"),
    isActive: getCheckbox(formData, "isActive"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الكوبون.", fieldErrors(parsed.error), values);
  }

  if (!(await assertOwnsCourse(teacher.id, parsed.data.courseId))) {
    return failure(
      "الكورس غير موجود أو ليس من كورساتك.",
      { courseId: ["اختار كورس من كورساتك."] },
      values,
    );
  }

  if (restrictToStudent && targetStudentIds.length === 0) {
    return failure(
      "اختار الطلاب المخصص لهم الكوبون.",
      { targetStudentIds: ["اختار طالب واحد على الأقل."] },
      values,
    );
  }

  if (
    targetStudentIds.length > 0 &&
    !(await assertTeacherStudents(teacher.id, targetStudentIds))
  ) {
    return failure(
      "فيه طالب مختار غير موجود ضمن طلاب كورساتك.",
      { targetStudentIds: ["اختار طلاب من طلاب كورساتك فقط."] },
      values,
    );
  }

  const supabase = await createClient();
  const couponUpdate: CouponUpdate = {
    course_id: parsed.data.courseId,
    code: parsed.data.code,
    discount_type: parsed.data.discountType as DiscountType,
    discount_value: parsed.data.discountValue,
    usage_limit: parsed.data.usageLimit ?? null,
    target_student_id: null,
    expires_at: parsed.data.expiresAt || null,
    is_active: parsed.data.isActive ?? false,
  };
  let { error } = await supabase
    .from("coupons")
    .update(couponUpdate)
    .eq("id", parsed.data.couponId)
    .eq("teacher_id", teacher.id);

  if (
    error &&
    isMissingCouponTargetColumn(error) &&
    targetStudentIds.length === 0
  ) {
    const legacyCouponUpdate: Omit<CouponUpdate, "target_student_id"> = {
      code: couponUpdate.code,
      course_id: couponUpdate.course_id,
      discount_type: couponUpdate.discount_type,
      discount_value: couponUpdate.discount_value,
      usage_limit: couponUpdate.usage_limit,
      expires_at: couponUpdate.expires_at,
      is_active: couponUpdate.is_active,
    };
    const legacyResult = await supabase
      .from("coupons")
      .update(legacyCouponUpdate)
      .eq("id", parsed.data.couponId)
      .eq("teacher_id", teacher.id);
    error = legacyResult.error;
  }

  if (error) {
    const couponFailure = couponFailureMessage(error);
    return failure(
      couponFailure.message.replace("إنشاء", "حفظ"),
      couponFailure.fieldErrors,
      values,
    );
  }

  await supabase
    .from("coupon_student_targets")
    .delete()
    .eq("coupon_id", parsed.data.couponId);

  if (targetStudentIds.length > 0) {
    const { error: targetsError } = await supabase
      .from("coupon_student_targets")
      .insert(
        targetStudentIds.map((studentId) => ({
          coupon_id: parsed.data.couponId,
          student_id: studentId,
        })),
      );

    if (targetsError) {
      return failure(
        "تم حفظ الكوبون، لكن تعذر حفظ الطلاب المخصصين. تأكد من تطبيق آخر migration.",
        undefined,
        values,
      );
    }
  }

  revalidatePath("/dashboard/teacher/coupons");
  return success("تم حفظ الكوبون.");
}

export async function deleteCouponAction(formData: FormData) {
  const couponId = getString(formData, "couponId");
  const { teacher } = await requireTeacher();
  const supabase = await createClient();

  await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId)
    .eq("teacher_id", teacher.id);

  revalidatePath("/dashboard/teacher/coupons");
}
