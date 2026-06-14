"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/auth/action-state";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getStudentPhotoValidationMessage,
  loginSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  studentSignUpServerSchema,
} from "@/lib/validations/auth";
import type { Database } from "@/types/database";

type StudentGender = Database["public"]["Enums"]["student_gender"];
type StudentGrade = Database["public"]["Enums"]["student_grade"];
type StudentSection = Database["public"]["Enums"]["student_section"];
type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

function failure(
  message: string,
  fieldErrors?: Record<string, string[]>,
  values?: Record<string, string>,
) {
  return {
    status: "error" as const,
    message,
    fieldErrors,
    values,
  };
}

function success(message: string) {
  return {
    status: "success" as const,
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

function getFormValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, getString(formData, key)]));
}

function getOptionalUpload(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
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

function getAdminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.error("Supabase admin client is not configured.", error);
    return null;
  }
}

async function deletePartialUser(admin: SupabaseAdminClient, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Failed to delete partial signup user.", error);
  }
}

function getCreateUserFailureMessage(errorMessage?: string) {
  const normalizedMessage = errorMessage?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already been registered") ||
    normalizedMessage.includes("already exists")
  ) {
    return {
      message: "الإيميل مسجل قبل كده.",
      fieldErrors: { email: ["الإيميل مسجل قبل كده."] },
    };
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("over_email_send_rate_limit")
  ) {
    return {
      message:
        "خدمة إرسال إيميلات التأكيد وصلت للحد المسموح مؤقتًا. جرّب بعد دقيقة.",
      fieldErrors: undefined,
    };
  }

  return {
    message: "تعذر إنشاء الحساب. جرّب مرة أخرى.",
    fieldErrors: undefined,
  };
}

async function uploadAvatar(
  admin: SupabaseAdminClient,
  userId: string,
  file: File,
) {
  const validationMessage = getStudentPhotoValidationMessage(file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const path = `${userId}/student-${Date.now()}.${getFileExtension(file)}`;
  const { error } = await admin.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, ["email", "password"]);
  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return failure(
      "راجع بيانات تسجيل الدخول.",
      fieldErrors(parsed.error),
      values,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return failure("الإيميل أو كلمة المرور غير صحيحة.", undefined, values);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failure(
      "تعذر تحميل الجلسة. جرّب تسجيل الدخول مرة أخرى.",
      undefined,
      values,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return failure(
      "الحساب موجود لكن ملف الصلاحيات غير مكتمل.",
      undefined,
      values,
    );
  }

  redirect(getRoleHomePath(profile.role));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, ["email"]);
  const parsed = loginSchema.pick({ email: true }).safeParse({
    email: getString(formData, "email"),
  });

  if (!parsed.success) {
    return failure(
      "اكتب بريد إلكتروني صحيح.",
      fieldErrors(parsed.error),
      values,
    );
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return failure(
      "تعذر إرسال رابط الاستعادة. جرّب مرة أخرى.",
      undefined,
      values,
    );
  }

  return success("لو البريد مسجل، هيوصل رابط تغيير كلمة المرور خلال دقائق.");
}

export async function resetPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, ["password", "confirmPassword"]);
  const parsed = resetPasswordSchema.safeParse({
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return failure(
      "راجع كلمة المرور الجديدة.",
      fieldErrors(parsed.error),
      values,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return failure(
      "رابط تغيير كلمة المرور غير صالح أو انتهت صلاحيته.",
      undefined,
      values,
    );
  }

  await supabase.auth.signOut();
  redirect("/login?passwordChanged=1");
}

export async function studentSignUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "fullName",
    "studentPhone",
    "fatherPhone",
    "schoolName",
    "gender",
    "grade",
    "section",
    "email",
    "password",
    "confirmPassword",
  ]);
  const parsed = studentSignUpServerSchema.safeParse({
    fullName: getString(formData, "fullName"),
    studentPhone: getString(formData, "studentPhone"),
    fatherPhone: getString(formData, "fatherPhone"),
    schoolName: getString(formData, "schoolName"),
    gender: getString(formData, "gender"),
    grade: getString(formData, "grade"),
    section: getString(formData, "section"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
    photo: formData.get("photo"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات التسجيل.", fieldErrors(parsed.error), values);
  }

  const photo = getOptionalUpload(formData, "photo");

  const admin = getAdminClient();

  if (!admin) {
    return failure(
      "إعدادات التسجيل على السيرفر غير مكتملة. تأكد من SUPABASE_SERVICE_ROLE_KEY في Vercel.",
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
        role: "student",
      },
    });

  if (createUserError || !authData.user) {
    console.error("Failed to create signup auth user.", createUserError);
    const createUserFailure = getCreateUserFailureMessage(
      createUserError?.message,
    );

    return failure(
      createUserFailure.message,
      createUserFailure.fieldErrors,
      values,
    );
  }

  let photoUrl: string | null = null;

  if (photo) {
    try {
      photoUrl = await uploadAvatar(admin, authData.user.id, photo);
    } catch {
      await deletePartialUser(admin, authData.user.id);
      return failure(
        "رفع الصورة فشل. جرّب بصورة أصغر أو بصيغة JPG/PNG/WEBP.",
        {
          photo: ["تعذر رفع الصورة. جرّب بصورة أصغر."],
        },
        values,
      );
    }
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authData.user.id,
    full_name: parsed.data.fullName,
    role: "student",
    ...(photoUrl ? { avatar_url: photoUrl } : {}),
    phone: parsed.data.studentPhone,
  });

  if (profileError) {
    console.error("Failed to save signup profile.", profileError);
    await deletePartialUser(admin, authData.user.id);
    return failure(
      "تعذر حفظ ملف الطالب. تأكد إن Phase 1 اتطبقت على Supabase.",
      undefined,
      values,
    );
  }

  const { error: studentError } = await admin.from("students").upsert(
    {
      profile_id: authData.user.id,
      student_phone: parsed.data.studentPhone,
      father_phone: parsed.data.fatherPhone,
      school_name: parsed.data.schoolName,
      gender: parsed.data.gender as StudentGender,
      grade: parsed.data.grade as StudentGrade,
      section: parsed.data.section as StudentSection,
      photo_url: photoUrl ?? "",
    },
    {
      onConflict: "profile_id",
    },
  );

  if (studentError) {
    console.error("Failed to save signup student record.", studentError);
    await deletePartialUser(admin, authData.user.id);
    return failure("تعذر حفظ بيانات الطالب الإضافية.", undefined, values);
  }

  redirect("/login?registered=1");
}

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "fullName",
    "phone",
    "studentPhone",
    "fatherPhone",
    "schoolName",
    "gender",
    "grade",
    "section",
  ]);
  const parsed = profileUpdateSchema.safeParse({
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    studentPhone: getOptionalString(formData, "studentPhone"),
    fatherPhone: getOptionalString(formData, "fatherPhone"),
    schoolName: getOptionalString(formData, "schoolName"),
    gender: getOptionalString(formData, "gender"),
    grade: getOptionalString(formData, "grade"),
    section: getOptionalString(formData, "section"),
    photo: formData.get("photo"),
  });

  if (!parsed.success) {
    return failure(
      "راجع بيانات الملف الشخصي.",
      fieldErrors(parsed.error),
      values,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return failure("تعذر تحميل ملف الصلاحيات.", undefined, values);
  }

  const admin = getAdminClient();

  if (!admin) {
    return failure(
      "إعدادات السيرفر غير مكتملة. تأكد من SUPABASE_SERVICE_ROLE_KEY في Vercel.",
      undefined,
      values,
    );
  }

  const photo = getOptionalUpload(formData, "photo");
  let photoUrl: string | null = null;

  if (photo) {
    const validationMessage = getStudentPhotoValidationMessage(photo);

    if (validationMessage) {
      return failure(
        validationMessage,
        {
          photo: [validationMessage],
        },
        values,
      );
    }

    try {
      photoUrl = await uploadAvatar(admin, user.id, photo);
    } catch {
      return failure(
        "تعذر رفع الصورة الجديدة.",
        { photo: ["تعذر رفع الصورة الجديدة."] },
        values,
      );
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      ...(photoUrl ? { avatar_url: photoUrl } : {}),
    })
    .eq("id", user.id);

  if (profileError) {
    return failure("تعذر تحديث الملف الشخصي.", undefined, values);
  }

  if (profile.role === "student") {
    if (
      !parsed.data.studentPhone ||
      !parsed.data.fatherPhone ||
      !parsed.data.schoolName ||
      !parsed.data.gender ||
      !parsed.data.grade ||
      !parsed.data.section
    ) {
      return failure(
        "راجع بيانات الطالب المطلوبة.",
        {
          studentPhone: parsed.data.studentPhone ? [] : ["رقم الطالب مطلوب."],
          fatherPhone: parsed.data.fatherPhone ? [] : ["رقم ولي الأمر مطلوب."],
          schoolName: parsed.data.schoolName ? [] : ["اسم المدرسة مطلوب."],
          gender: parsed.data.gender ? [] : ["اختار النوع."],
          grade: parsed.data.grade ? [] : ["اختار السنة الدراسية."],
          section: parsed.data.section ? [] : ["اختار الشعبة المناسبة."],
        },
        values,
      );
    }

    const { error: studentError } = await admin
      .from("students")
      .update({
        student_phone: parsed.data.studentPhone,
        father_phone: parsed.data.fatherPhone,
        school_name: parsed.data.schoolName,
        gender: parsed.data.gender as StudentGender,
        grade: parsed.data.grade as StudentGrade,
        section: parsed.data.section as StudentSection,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      })
      .eq("profile_id", user.id);

    if (studentError) {
      return failure(
        "تم تحديث الملف الأساسي، لكن بيانات الطالب لم تُحفظ.",
        undefined,
        values,
      );
    }
  }

  revalidatePath("/profile");
  return success("تم حفظ التغييرات بنجاح.");
}
