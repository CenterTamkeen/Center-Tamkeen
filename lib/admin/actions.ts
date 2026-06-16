"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { deleteImageByUrl, uploadImage } from "@/lib/cloudinary";
import { requireRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  orderRejectSchema,
  teacherCreateSchema,
} from "@/lib/validations/admin";

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

function getOptionalImage(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getFormValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, getString(formData, key)]));
}

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.error("Supabase admin client is not configured.", error);
    return null;
  }
}

function getCreateTeacherFailureMessage(errorMessage?: string) {
  const normalized = errorMessage?.toLowerCase() ?? "";

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("already exists")
  ) {
    return {
      message: "الإيميل مسجل قبل كده.",
      fieldErrors: { email: ["الإيميل مسجل قبل كده."] },
    };
  }

  return {
    message: "تعذر إنشاء حساب المدرس. جرّب مرة أخرى.",
    fieldErrors: undefined,
  };
}

async function deletePartialUser(userId: string) {
  const admin = getAdminClient();

  if (!admin) {
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Failed to delete partial teacher user.", error);
  }
}

async function deletePartialAvatar(path: string) {
  await deleteImageByUrl(path);
}

function validateAvatar(file: File | null) {
  if (!file) {
    return null;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return "الصورة لازم تكون JPG أو PNG أو WebP.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "حجم الصورة لا يزيد عن 2MB.";
  }

  return null;
}

async function uploadTeacherAvatar(userId: string, file: File) {
  try {
    const result = await uploadImage(file, {
      folder: `tamkeen/avatars/${userId}`,
      publicId: `teacher-${crypto.randomUUID()}`,
      overwrite: false,
    });

    return { avatarUrl: result.secureUrl };
  } catch (error) {
    console.error("Failed to upload teacher avatar.", error);
    return { error: "تعذر رفع صورة المدرس. جرّب صورة أخرى." };
  }
}

export async function createTeacherAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin", "/dashboard/admin/teachers");

  const values = getFormValues(formData, [
    "fullName",
    "subject",
    "email",
    "password",
  ]);
  const avatar = getOptionalImage(formData, "avatar");
  const avatarError = validateAvatar(avatar);
  const parsed = teacherCreateSchema.safeParse({
    fullName: getString(formData, "fullName"),
    subject: getString(formData, "subject"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (avatarError) {
    return failure("راجع صورة المدرس.", { avatar: [avatarError] }, values);
  }

  if (!parsed.success) {
    return failure("راجع بيانات المدرس.", fieldErrors(parsed.error), values);
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure(
      "إعدادات الأدمن غير مكتملة. تأكد من SUPABASE_SERVICE_ROLE_KEY.",
      undefined,
      values,
    );
  }

  const { data: authData, error: createUserError } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        role: "teacher",
      },
    });

  if (createUserError || !authData.user) {
    const createFailure = getCreateTeacherFailureMessage(
      createUserError?.message,
    );
    return failure(createFailure.message, createFailure.fieldErrors, values);
  }

  let avatarUrl: string | null = null;

  if (avatar) {
    const uploadResult = await uploadTeacherAvatar(authData.user.id, avatar);

    if (uploadResult.error) {
      await deletePartialUser(authData.user.id);
      return failure(uploadResult.error, undefined, values);
    }

    avatarUrl = uploadResult.avatarUrl ?? null;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authData.user.id,
    full_name: parsed.data.fullName,
    role: "teacher",
    avatar_url: avatarUrl,
  });

  if (profileError) {
    console.error("Failed to save teacher profile.", profileError);
    if (avatarUrl) {
      await deletePartialAvatar(avatarUrl);
    }
    await deletePartialUser(authData.user.id);
    return failure("تعذر حفظ ملف المدرس.", undefined, values);
  }

  const { error: teacherError } = await admin.from("teachers").insert({
    profile_id: authData.user.id,
    subject: parsed.data.subject,
    avatar_url: avatarUrl,
    is_active: true,
  });

  if (teacherError) {
    console.error("Failed to save teacher record.", teacherError);
    if (avatarUrl) {
      await deletePartialAvatar(avatarUrl);
    }
    await deletePartialUser(authData.user.id);
    return failure(
      "تعذر حفظ بيانات المدرس. تأكد إن Trigger توليد slug مطبق.",
      undefined,
      values,
    );
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/teachers");
  return success("تم إنشاء حساب المدرس بنجاح.");
}

export async function toggleTeacherActiveAction(formData: FormData) {
  await requireRole("admin", "/dashboard/admin/teachers");

  const teacherId = getString(formData, "teacherId");
  const nextActive = getCheckbox(formData, "nextActive");
  const admin = getAdminClient();

  if (!admin) {
    return;
  }

  await admin
    .from("teachers")
    .update({ is_active: nextActive })
    .eq("id", teacherId);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/teachers");
}

export async function toggleAdminCoursePublishAction(formData: FormData) {
  await requireRole("admin", "/dashboard/admin/courses");

  const courseId = getString(formData, "courseId");
  const nextPublished = getCheckbox(formData, "nextPublished");
  const admin = getAdminClient();

  if (!admin || !courseId) {
    return;
  }

  await admin
    .from("courses")
    .update({ is_published: nextPublished })
    .eq("id", courseId);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
}

export async function deleteAdminCourseAction(formData: FormData) {
  await requireRole("admin", "/dashboard/admin/courses");

  const courseId = getString(formData, "courseId");
  const admin = getAdminClient();

  if (!admin || !courseId) {
    return;
  }

  await admin.from("courses").delete().eq("id", courseId);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/admin/reports");
}

export async function deleteReviewAction(formData: FormData) {
  await requireRole("admin", "/dashboard/admin/reviews");

  const reviewId = getString(formData, "reviewId");
  const admin = getAdminClient();

  if (!admin || !reviewId) {
    return;
  }

  await admin.from("reviews").delete().eq("id", reviewId);

  revalidatePath("/dashboard/admin/reviews");
}

export async function deleteTeacherAction(formData: FormData) {
  await requireRole("admin", "/dashboard/admin/teachers");

  const teacherId = getString(formData, "teacherId");
  const admin = getAdminClient();

  if (!admin || !teacherId) {
    return;
  }

  const { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .select("id, profile_id, slug, avatar_url, cover_url")
    .eq("id", teacherId)
    .maybeSingle();

  if (teacherError || !teacher) {
    console.error("Failed to load teacher before deletion.", teacherError);
    return;
  }

  const { data: courses, error: coursesError } = await admin
    .from("courses")
    .select("id, thumbnail_url")
    .eq("teacher_id", teacher.id);

  if (coursesError) {
    console.error(
      "Failed to load teacher courses before deletion.",
      coursesError,
    );
    return;
  }

  const courseIds = (courses ?? []).map((course) => course.id);

  if (courseIds.length > 0) {
    const { error: orderItemsError } = await admin
      .from("order_items")
      .delete()
      .in("course_id", courseIds);

    if (orderItemsError) {
      console.error("Failed to delete teacher order items.", orderItemsError);
      return;
    }
  }

  const { error: earningsError } = await admin
    .from("teacher_earnings")
    .delete()
    .eq("teacher_id", teacher.id);

  if (earningsError) {
    console.error("Failed to delete teacher earnings.", earningsError);
    return;
  }

  await Promise.all([
    deleteImageByUrl(teacher.avatar_url),
    deleteImageByUrl(teacher.cover_url),
    ...(courses ?? []).map((course) => deleteImageByUrl(course.thumbnail_url)),
  ]);

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(
    teacher.profile_id,
  );

  if (deleteUserError) {
    console.error("Failed to delete teacher auth user.", deleteUserError);
    return;
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/teachers/${teacher.slug}`);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/teachers");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/admin/reports");
}

export async function rejectOrderAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin", "/dashboard/admin/orders");

  const values = getFormValues(formData, ["orderId", "rejectionReason"]);
  const parsed = orderRejectSchema.safeParse({
    orderId: getString(formData, "orderId"),
    rejectionReason: getString(formData, "rejectionReason"),
  });

  if (!parsed.success) {
    return failure("راجع سبب الإلغاء.", fieldErrors(parsed.error), values);
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure("إعدادات الأدمن غير مكتملة.", undefined, values);
  }

  const { error } = await admin
    .from("orders")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.rejectionReason,
    })
    .eq("id", parsed.data.orderId);

  if (error) {
    return failure("تعذر تحديث حالة الطلب.", undefined, values);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/orders");
  revalidatePath("/dashboard/admin/reports");
  return success("تم تسجيل إلغاء الطلب.");
}
