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

function failure(message: string, fieldErrors?: Record<string, string[]>) {
  return {
    status: "error" as const,
    message,
    fieldErrors,
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

async function uploadAvatar(userId: string, file: File) {
  const validationMessage = getStudentPhotoValidationMessage(file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const admin = createAdminClient();
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
  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات تسجيل الدخول.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return failure("الإيميل أو كلمة المرور غير صحيحة.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failure("تعذر تحميل الجلسة. جرّب تسجيل الدخول مرة أخرى.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return failure("الحساب موجود لكن ملف الصلاحيات غير مكتمل.");
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
  const parsed = loginSchema.pick({ email: true }).safeParse({
    email: getString(formData, "email"),
  });

  if (!parsed.success) {
    return failure("اكتب بريد إلكتروني صحيح.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/reset-password`,
    },
  );

  if (error) {
    return failure("تعذر إرسال رابط الاستعادة. جرّب مرة أخرى.");
  }

  return success("لو البريد مسجل، هيوصل رابط تغيير كلمة المرور خلال دقائق.");
}

export async function resetPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return failure("راجع كلمة المرور الجديدة.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return failure("رابط تغيير كلمة المرور غير صالح أو انتهت صلاحيته.");
  }

  await supabase.auth.signOut();
  redirect("/login?passwordChanged=1");
}

export async function studentSignUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
    return failure("راجع بيانات التسجيل.", fieldErrors(parsed.error));
  }

  const photo = getOptionalUpload(formData, "photo");

  if (!photo) {
    return failure("صورة الطالب مطلوبة.", {
      photo: ["صورة الطالب مطلوبة."],
    });
  }

  const supabase = await createClient();
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: "student",
      },
    },
  });

  if (signUpError || !authData.user) {
    return failure(
      signUpError?.message.includes("already registered")
        ? "الإيميل مسجل قبل كده."
        : "تعذر إنشاء الحساب. جرّب مرة أخرى.",
    );
  }

  const admin = createAdminClient();
  let photoUrl: string;

  try {
    photoUrl = await uploadAvatar(authData.user.id, photo);
  } catch {
    return failure("الحساب اتعمل، لكن رفع الصورة فشل. جرّب بصورة أصغر.");
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authData.user.id,
    full_name: parsed.data.fullName,
    role: "student",
    avatar_url: photoUrl,
    phone: parsed.data.studentPhone,
  });

  if (profileError) {
    return failure("تعذر حفظ ملف الطالب. تأكد إن Phase 1 اتطبقت على Supabase.");
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
      photo_url: photoUrl,
    },
    {
      onConflict: "profile_id",
    },
  );

  if (studentError) {
    return failure("تعذر حفظ بيانات الطالب الإضافية.");
  }

  await supabase.auth.signOut();
  redirect("/login?registered=1");
}

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileUpdateSchema.safeParse({
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    studentPhone: getString(formData, "studentPhone"),
    fatherPhone: getString(formData, "fatherPhone"),
    schoolName: getString(formData, "schoolName"),
    gender: getString(formData, "gender"),
    grade: getString(formData, "grade"),
    section: getString(formData, "section"),
    photo: formData.get("photo"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الملف الشخصي.", fieldErrors(parsed.error));
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
    return failure("تعذر تحميل ملف الصلاحيات.");
  }

  const admin = createAdminClient();
  const photo = getOptionalUpload(formData, "photo");
  let photoUrl: string | null = null;

  if (photo) {
    const validationMessage = getStudentPhotoValidationMessage(photo);

    if (validationMessage) {
      return failure(validationMessage, {
        photo: [validationMessage],
      });
    }

    try {
      photoUrl = await uploadAvatar(user.id, photo);
    } catch {
      return failure("تعذر رفع الصورة الجديدة.");
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
    return failure("تعذر تحديث الملف الشخصي.");
  }

  if (profile.role === "student") {
    const { error: studentError } = await admin
      .from("students")
      .update({
        student_phone: parsed.data.studentPhone ?? "",
        father_phone: parsed.data.fatherPhone ?? "",
        school_name: parsed.data.schoolName ?? "",
        gender: parsed.data.gender as StudentGender,
        grade: parsed.data.grade as StudentGrade,
        section: parsed.data.section as StudentSection,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      })
      .eq("profile_id", user.id);

    if (studentError) {
      return failure("تم تحديث الملف الأساسي، لكن بيانات الطالب لم تُحفظ.");
    }
  }

  revalidatePath("/profile");
  return success("تم حفظ التغييرات بنجاح.");
}
