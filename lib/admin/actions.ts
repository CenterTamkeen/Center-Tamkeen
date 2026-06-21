"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { deleteImageByUrl, uploadImage } from "@/lib/cloudinary";
import { requireRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activationCodeDeleteSchema,
  activationCodeGenerateSchema,
  teacherCreateSchema,
  teacherUpdateSchema,
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

async function deletePartialAvatar(path?: string | null) {
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

function revalidateTeacherAdminPaths(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/courses");
  if (slug) {
    revalidatePath(`/teachers/${slug}`);
  }
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/teachers");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/admin/reports");
}

function revalidateActivationCodePaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/activation-codes");
  revalidatePath("/dashboard/admin/reports");
}

function generateSixDigitCode() {
  return String(
    crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000,
  ).padStart(6, "0");
}

async function buildUniqueActivationCodes(
  admin: ReturnType<typeof createAdminClient>,
  quantity: number,
) {
  const codes = new Set<string>();
  let attempts = 0;

  while (codes.size < quantity && attempts < quantity * 40) {
    attempts += 1;
    codes.add(generateSixDigitCode());

    if (codes.size >= quantity) {
      const candidateCodes = Array.from(codes);
      const { data, error } = await admin
        .from("activation_codes")
        .select("code")
        .in("code", candidateCodes);

      if (error) {
        return { codes: [], error: "تعذر مراجعة الأكواد الموجودة." };
      }

      for (const existing of data ?? []) {
        codes.delete(existing.code);
      }
    }
  }

  if (codes.size < quantity) {
    return {
      codes: [],
      error: "تعذر توليد أكواد غير مكررة. جرّب عدد أقل.",
    };
  }

  return { codes: Array.from(codes), error: null };
}

export async function createTeacherAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin", "/dashboard/admin/teachers");

  const values = getFormValues(formData, [
    "fullName",
    "englishName",
    "subject",
    "phone",
    "email",
    "password",
  ]);
  const avatar = getOptionalImage(formData, "avatar");
  const avatarError = validateAvatar(avatar);
  const parsed = teacherCreateSchema.safeParse({
    fullName: getString(formData, "fullName"),
    englishName: getString(formData, "englishName"),
    subject: getString(formData, "subject"),
    phone: getString(formData, "phone"),
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
        phone: parsed.data.phone || null,
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
    phone: parsed.data.phone || null,
  });

  if (profileError) {
    console.error("Failed to save teacher profile.", profileError);
    if (avatarUrl) {
      await deletePartialAvatar(avatarUrl);
    }
    await deletePartialUser(authData.user.id);
    return failure("تعذر حفظ ملف المدرس.", undefined, values);
  }

  const teacherPayload = {
    profile_id: authData.user.id,
    slug: parsed.data.englishName,
    subject: parsed.data.subject,
    avatar_url: avatarUrl,
    is_active: true,
  };

  const { data: existingTeachers, error: existingTeacherError } = await admin
    .from("teachers")
    .select("id")
    .eq("profile_id", authData.user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingTeacherError) {
    console.error(
      "Failed to check existing teacher record.",
      existingTeacherError,
    );
    if (avatarUrl) {
      await deletePartialAvatar(avatarUrl);
    }
    await deletePartialUser(authData.user.id);
    return failure("تعذر حفظ بيانات المدرس.", undefined, values);
  }

  const existingTeacher = existingTeachers?.[0];
  const { error: teacherError } = existingTeacher
    ? await admin
        .from("teachers")
        .update(teacherPayload)
        .eq("id", existingTeacher.id)
    : await admin.from("teachers").insert(teacherPayload);

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

export async function updateTeacherAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin", "/dashboard/admin/teachers");

  const values = getFormValues(formData, [
    "teacherId",
    "fullName",
    "englishName",
    "subject",
    "phone",
    "isActive",
  ]);
  const avatar = getOptionalImage(formData, "avatar");
  const avatarError = validateAvatar(avatar);
  const parsed = teacherUpdateSchema.safeParse({
    teacherId: getString(formData, "teacherId"),
    fullName: getString(formData, "fullName"),
    englishName: getString(formData, "englishName"),
    subject: getString(formData, "subject"),
    phone: getString(formData, "phone"),
    isActive: getCheckbox(formData, "isActive"),
  });

  if (avatarError) {
    return failure("راجع صورة المدرس.", { avatar: [avatarError] }, values);
  }

  if (!parsed.success) {
    return failure("راجع بيانات المدرس.", fieldErrors(parsed.error), values);
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure("إعدادات الأدمن غير مكتملة.", undefined, values);
  }

  const { data: teacher, error: loadError } = await admin
    .from("teachers")
    .select("id, profile_id, slug, avatar_url")
    .eq("id", parsed.data.teacherId)
    .maybeSingle();

  if (loadError || !teacher) {
    console.error("Failed to load teacher before update.", loadError);
    return failure("تعذر تحميل بيانات المدرس.", undefined, values);
  }

  let avatarUrl: string | null = null;

  if (avatar) {
    const uploadResult = await uploadTeacherAvatar(teacher.profile_id, avatar);

    if (uploadResult.error) {
      return failure(uploadResult.error, undefined, values);
    }

    avatarUrl = uploadResult.avatarUrl ?? null;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", teacher.profile_id);

  if (profileError) {
    console.error("Failed to update teacher profile.", profileError);
    if (avatarUrl) {
      await deletePartialAvatar(avatarUrl);
    }
    return failure("تعذر تحديث ملف المدرس.", undefined, values);
  }

  const { data: updatedTeacher, error: teacherError } = await admin
    .from("teachers")
    .update({
      slug: parsed.data.englishName,
      subject: parsed.data.subject,
      is_active: parsed.data.isActive,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", teacher.id)
    .select("slug")
    .maybeSingle();

  if (teacherError) {
    console.error("Failed to update teacher record.", teacherError);
    if (avatarUrl) {
      await deletePartialAvatar(avatarUrl);
    }
    return failure("تعذر تحديث بيانات المدرس.", undefined, values);
  }

  const { error: authError } = await admin.auth.admin.updateUserById(
    teacher.profile_id,
    {
      user_metadata: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        role: "teacher",
      },
    },
  );

  if (authError) {
    console.error("Failed to update teacher auth metadata.", authError);
  }

  if (avatarUrl) {
    await deletePartialAvatar(teacher.avatar_url);
  }

  revalidateTeacherAdminPaths(teacher.slug);
  revalidateTeacherAdminPaths(updatedTeacher?.slug);
  return success("تم تحديث بيانات المدرس بنجاح.");
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

export async function generateActivationCodesAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole(
    "admin",
    "/dashboard/admin/activation-codes",
  );

  const values = getFormValues(formData, ["courseId", "quantity", "expiresAt"]);
  const parsed = activationCodeGenerateSchema.safeParse({
    courseId: getString(formData, "courseId"),
    quantity: getString(formData, "quantity"),
    expiresAt: getString(formData, "expiresAt"),
  });

  if (!parsed.success) {
    return failure(
      "راجع بيانات توليد الأكواد.",
      fieldErrors(parsed.error),
      values,
    );
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure("إعدادات الأدمن غير مكتملة.", undefined, values);
  }

  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id")
    .eq("id", parsed.data.courseId)
    .maybeSingle();

  if (courseError || !course) {
    return failure("الكورس غير موجود.", undefined, values);
  }

  const generated = await buildUniqueActivationCodes(
    admin,
    parsed.data.quantity,
  );

  if (generated.error) {
    return failure(generated.error, undefined, values);
  }

  const expiresAt = new Date(parsed.data.expiresAt).toISOString();
  const { error } = await admin.from("activation_codes").insert(
    generated.codes.map((code) => ({
      course_id: parsed.data.courseId,
      code,
      expires_at: expiresAt,
      created_by_profile_id: profile.id,
    })),
  );

  if (error) {
    console.error("Failed to generate activation codes.", error);
    return failure(
      "تعذر حفظ الأكواد. جرّب مرة أخرى لاحتمال وجود كود مكرر.",
      undefined,
      values,
    );
  }

  revalidateActivationCodePaths();
  return success(
    `تم توليد ${generated.codes.length.toLocaleString("ar-EG")} كود بنجاح.`,
    {
      generatedCodes: generated.codes.join(","),
      courseId: parsed.data.courseId,
      expiresAt,
    },
  );
}

export async function deleteActivationCodeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin", "/dashboard/admin/activation-codes");

  const values = getFormValues(formData, ["codeId"]);
  const parsed = activationCodeDeleteSchema.safeParse({
    codeId: getString(formData, "codeId"),
  });

  if (!parsed.success) {
    return failure("الكود غير صحيح.", fieldErrors(parsed.error), values);
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure("إعدادات الأدمن غير مكتملة.", undefined, values);
  }

  const { error } = await admin
    .from("activation_codes")
    .delete()
    .eq("id", parsed.data.codeId)
    .is("used_at", null);

  if (error) {
    return failure("تعذر حذف الكود. الأكواد المستخدمة لا تُحذف.");
  }

  revalidateActivationCodePaths();
  return success("تم حذف الكود.");
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

export async function deleteTeacherAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin", "/dashboard/admin/teachers");

  const teacherId = getString(formData, "teacherId");
  const admin = getAdminClient();

  if (!admin || !teacherId) {
    return failure("تعذر حذف المدرس.");
  }

  let { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .select("id, profile_id, slug, avatar_url, cover_url")
    .eq("id", teacherId)
    .maybeSingle();

  if (
    teacherError &&
    (teacherError.message.includes("cover_url") ||
      teacherError.message.includes("schema cache") ||
      teacherError.message.includes("Could not find"))
  ) {
    const fallback = await admin
      .from("teachers")
      .select("id, profile_id, slug, avatar_url")
      .eq("id", teacherId)
      .maybeSingle();

    teacher = fallback.data ? { ...fallback.data, cover_url: null } : null;
    teacherError = fallback.error;
  }

  if (teacherError || !teacher) {
    console.error("Failed to load teacher before deletion.", teacherError);
    return failure(
      teacherError?.message
        ? `تعذر تحميل بيانات المدرس: ${teacherError.message}`
        : "تعذر تحميل بيانات المدرس قبل الحذف.",
    );
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
    return failure("تعذر تحميل كورسات المدرس قبل الحذف.");
  }

  const courseIds = (courses ?? []).map((course) => course.id);

  if (courseIds.length > 0) {
    const { error: orderItemsError } = await admin
      .from("order_items")
      .delete()
      .in("course_id", courseIds);

    if (orderItemsError) {
      console.error("Failed to delete teacher order items.", orderItemsError);
      return failure("تعذر حذف عناصر طلبات كورسات المدرس.");
    }
  }

  const { error: earningsError } = await admin
    .from("teacher_earnings")
    .delete()
    .eq("teacher_id", teacher.id);

  if (earningsError) {
    console.error("Failed to delete teacher earnings.", earningsError);
    return failure("تعذر حذف أرباح المدرس قبل حذف الحساب.");
  }

  await Promise.all([
    deleteImageByUrl(teacher.avatar_url),
    deleteImageByUrl(teacher.cover_url),
    ...(courses ?? []).map((course) => deleteImageByUrl(course.thumbnail_url)),
  ]);

  const { error: deleteProfileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", teacher.profile_id);

  if (deleteProfileError) {
    console.error("Failed to delete teacher profile.", deleteProfileError);
    return failure("تعذر حذف ملف المدرس من قاعدة البيانات.");
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(
    teacher.profile_id,
  );

  if (deleteUserError) {
    console.error("Failed to delete teacher auth user.", deleteUserError);
  }

  revalidateTeacherAdminPaths(teacher.slug);
  return success("تم حذف المدرس بنجاح.");
}
