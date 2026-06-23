"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/auth/action-state";
import { deleteImageByUrl, uploadImage } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email/smtp";
import { getPasswordResetEmailHtml } from "@/lib/email/templates";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getStudentPhotoValidationMessage,
  getTeacherCoverValidationMessage,
  changePasswordSchema,
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

const emailDeliveryHint =
  "لو مش لاقي الرسالة في الوارد، دور عليها في الرسائل غير المرغوب فيها أو Spam.";

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

function getPasswordResetLink(siteUrl: string, tokenHash: string) {
  const resetUrl = new URL("/auth/callback", siteUrl);

  resetUrl.searchParams.set("next", "/reset-password");
  resetUrl.searchParams.set("type", "recovery");
  resetUrl.searchParams.set("token_hash", tokenHash);

  return resetUrl.toString();
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.error("Supabase admin client is not configured.", error);
    return null;
  }
}

async function getSiteUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const requestUrl = host ? `${protocol}://${host}` : null;
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (requestUrl && envUrl?.startsWith("http://localhost")) {
    return requestUrl;
  }

  return envUrl ?? requestUrl ?? "http://localhost:3000";
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

function isStudentPhoneConflict(error?: { code?: string; message?: string }) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "23505" &&
    (message.includes("students_student_phone") ||
      message.includes("student_phone") ||
      message.includes("duplicate key"))
  );
}

function isMissingTeacherCoverColumn(error?: { message?: string }) {
  return (
    error?.message?.includes("cover_url") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("Could not find")
  );
}

async function uploadAvatar(userId: string, file: File) {
  const validationMessage = getStudentPhotoValidationMessage(file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const result = await uploadImage(file, {
    folder: `tamkeen/avatars/${userId}`,
    publicId: `avatar-${Date.now()}`,
  });
  return result.secureUrl;
}

async function uploadTeacherCover(teacherId: string, file: File) {
  const validationMessage = getTeacherCoverValidationMessage(file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const result = await uploadImage(file, {
    folder: `tamkeen/teachers/${teacherId}/covers`,
    publicId: `cover-${Date.now()}`,
  });
  return result.secureUrl;
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

  const admin = getAdminClient();

  if (!admin) {
    return failure(
      "إعدادات استعادة كلمة المرور على السيرفر غير مكتملة.",
      undefined,
      values,
    );
  }

  const siteUrl = await getSiteUrl();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    },
  });

  if (error) {
    console.error("Failed to generate password reset link.", error);
    if (error.message.toLowerCase().includes("not found")) {
      return success(
        `لو البريد مسجل، هيوصل رابط تغيير كلمة المرور خلال دقائق. ${emailDeliveryHint}`,
      );
    }

    return failure(
      "تعذر إرسال رابط الاستعادة. جرّب مرة أخرى.",
      undefined,
      values,
    );
  }

  if (data.properties?.hashed_token) {
    const resetLink = getPasswordResetLink(
      siteUrl,
      data.properties.hashed_token,
    );
    const { error: sendError } = await sendEmail({
      to: parsed.data.email,
      subject: "تغيير كلمة مرور تمكين",
      html: getPasswordResetEmailHtml(resetLink, siteUrl),
      text: [
        "تغيير كلمة مرور تمكين",
        "",
        "وصلنا طلب لتغيير كلمة مرور حسابك.",
        `افتح الرابط التالي لاختيار كلمة مرور جديدة: ${resetLink}`,
        "لو الطلب مش منك، تجاهل الرسالة بأمان.",
      ].join("\n"),
    });

    if (sendError) {
      console.error("Failed to send password reset email.", sendError);
      return failure(
        "تعذر إرسال رابط الاستعادة. جرّب مرة أخرى.",
        undefined,
        values,
      );
    }
  }

  return success(
    `لو البريد مسجل، هيوصل رابط تغيير كلمة المرور خلال دقائق. ${emailDeliveryHint}`,
  );
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

  if (profile?.role === "teacher") {
    return failure("تغيير كلمة مرور المدرس غير متاح.", undefined, values);
  }

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

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "currentPassword",
    "newPassword",
    "confirmNewPassword",
  ]);
  const parsed = changePasswordSchema.safeParse({
    currentPassword: getString(formData, "currentPassword"),
    newPassword: getString(formData, "newPassword"),
    confirmNewPassword: getString(formData, "confirmNewPassword"),
  });

  if (!parsed.success) {
    return failure(
      "راجع بيانات كلمة المرور.",
      fieldErrors(parsed.error),
      values,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "teacher") {
    return failure("تغيير كلمة مرور المدرس غير متاح.", undefined, values);
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (passwordError) {
    return failure(
      "كلمة المرور الحالية غير صحيحة.",
      {
        currentPassword: ["كلمة المرور الحالية غير صحيحة."],
      },
      values,
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return failure("تعذر تغيير كلمة المرور. جرّب مرة أخرى.", undefined, values);
  }

  return success("تم تغيير كلمة المرور بنجاح.");
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

  const { data: existingStudent, error: existingStudentError } = await admin
    .from("students")
    .select("id")
    .eq("student_phone", parsed.data.studentPhone)
    .maybeSingle();

  if (existingStudentError) {
    console.error(
      "Failed to check duplicate student phone.",
      existingStudentError,
    );
    return failure("تعذر مراجعة رقم الطالب. جرّب مرة أخرى.", undefined, values);
  }

  if (existingStudent) {
    return failure(
      "رقم الطالب مسجل قبل كده.",
      { studentPhone: ["رقم الطالب مسجل قبل كده."] },
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
      photoUrl = await uploadAvatar(authData.user.id, photo);
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
    await deleteImageByUrl(photoUrl);
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
    await deleteImageByUrl(photoUrl);
    await deletePartialUser(admin, authData.user.id);

    if (isStudentPhoneConflict(studentError)) {
      return failure(
        "رقم الطالب مسجل قبل كده.",
        { studentPhone: ["رقم الطالب مسجل قبل كده."] },
        values,
      );
    }

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
    "teacherSubject",
    "teacherBio",
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
    teacherSubject: getOptionalString(formData, "teacherSubject"),
    teacherBio: getOptionalString(formData, "teacherBio"),
    studentPhone: getOptionalString(formData, "studentPhone"),
    fatherPhone: getOptionalString(formData, "fatherPhone"),
    schoolName: getOptionalString(formData, "schoolName"),
    gender: getOptionalString(formData, "gender"),
    grade: getOptionalString(formData, "grade"),
    section: getOptionalString(formData, "section"),
    photo: formData.get("photo"),
    cover: formData.get("cover"),
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
  const cover = getOptionalUpload(formData, "cover");
  const shouldRemoveCover =
    profile.role === "teacher" && formData.get("removeCover") === "1" && !cover;
  let photoUrl: string | null = null;
  let coverUrl: string | null = null;

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
      photoUrl = await uploadAvatar(user.id, photo);
    } catch (error) {
      console.error("Failed to upload profile avatar.", error);
      return failure(
        "تعذر رفع الصورة الجديدة.",
        { photo: ["تعذر رفع الصورة الجديدة."] },
        values,
      );
    }
  }

  if (profile.role === "teacher" && cover) {
    const validationMessage = getTeacherCoverValidationMessage(cover);

    if (validationMessage) {
      return failure(
        validationMessage,
        {
          cover: [validationMessage],
        },
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
          section: parsed.data.section ? [] : ["اختار المسار المناسب."],
        },
        values,
      );
    }

    const { data: existingStudent, error: existingStudentError } = await admin
      .from("students")
      .select("id")
      .eq("student_phone", parsed.data.studentPhone)
      .neq("profile_id", user.id)
      .maybeSingle();

    if (existingStudentError) {
      console.error(
        "Failed to check duplicate profile student phone.",
        existingStudentError,
      );
      return failure(
        "تعذر مراجعة رقم الطالب. جرّب مرة أخرى.",
        undefined,
        values,
      );
    }

    if (existingStudent) {
      return failure(
        "رقم الطالب مسجل قبل كده.",
        { studentPhone: ["رقم الطالب مسجل قبل كده."] },
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
      await deleteImageByUrl(photoUrl);

      if (isStudentPhoneConflict(studentError)) {
        return failure(
          "رقم الطالب مسجل قبل كده.",
          { studentPhone: ["رقم الطالب مسجل قبل كده."] },
          values,
        );
      }

      return failure(
        "تم تحديث الملف الأساسي، لكن بيانات الطالب لم تُحفظ.",
        undefined,
        values,
      );
    }
  } else if (profile.role === "teacher") {
    const currentTeacherQuery = await admin
      .from("teachers")
      .select("id, cover_url")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    let currentTeacher = currentTeacherQuery.data?.[0] ?? null;
    let currentTeacherError = currentTeacherQuery.error;
    let missingTeacherCoverColumn = false;

    if (
      currentTeacherError &&
      isMissingTeacherCoverColumn(currentTeacherError)
    ) {
      missingTeacherCoverColumn = true;
      const fallbackTeacherQuery = await admin
        .from("teachers")
        .select("id")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      currentTeacher = fallbackTeacherQuery.data?.[0]
        ? { ...fallbackTeacherQuery.data[0], cover_url: null }
        : null;
      currentTeacherError = fallbackTeacherQuery.error;
    }

    if (currentTeacherError || !currentTeacher) {
      console.error(
        "Failed to load teacher profile before update.",
        currentTeacherError,
      );
      return failure("لا يوجد ملف مدرس مرتبط بحسابك.", undefined, values);
    }

    if ((cover || shouldRemoveCover) && missingTeacherCoverColumn) {
      return failure(
        "تحديث قاعدة البيانات الخاص بخلفية المدرس لسه متطبقش. طبق migration الخاص بالبانر وجرب تاني.",
        {
          cover: ["عمود خلفية المدرس غير موجود في قاعدة البيانات."],
        },
        values,
      );
    }

    if (cover && currentTeacher?.id) {
      try {
        coverUrl = await uploadTeacherCover(currentTeacher.id, cover);
      } catch (error) {
        console.error("Failed to upload teacher cover.", error);
        return failure(
          "تعذر رفع خلفية المدرس.",
          { cover: ["تعذر رفع الخلفية الجديدة."] },
          values,
        );
      }
    }

    const { data: teacher, error: teacherError } = await admin
      .from("teachers")
      .update({
        ...(parsed.data.teacherSubject
          ? { subject: parsed.data.teacherSubject }
          : {}),
        bio: parsed.data.teacherBio || null,
        ...(photoUrl ? { avatar_url: photoUrl } : {}),
        ...(coverUrl
          ? { cover_url: coverUrl }
          : shouldRemoveCover
            ? { cover_url: null }
            : {}),
      })
      .eq("id", currentTeacher.id)
      .select("slug")
      .maybeSingle();

    if (teacherError) {
      console.error("Failed to update teacher profile fields.", teacherError);
      await Promise.all([
        deleteImageByUrl(photoUrl),
        deleteImageByUrl(coverUrl),
      ]);
      return failure(
        "تم تحديث الملف الأساسي، لكن صورة صفحة المدرس لم تُحفظ.",
        undefined,
        values,
      );
    }

    if ((coverUrl || shouldRemoveCover) && currentTeacher.cover_url) {
      await deleteImageByUrl(currentTeacher.cover_url);
    }

    if (teacher?.slug) {
      revalidatePath(`/teachers/${teacher.slug}`);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/dashboard/teacher");
  return success("تم حفظ التغييرات بنجاح.");
}
