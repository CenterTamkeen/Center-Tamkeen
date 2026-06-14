"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
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
  const parsed = teacherCreateSchema.safeParse({
    fullName: getString(formData, "fullName"),
    subject: getString(formData, "subject"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

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

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authData.user.id,
    full_name: parsed.data.fullName,
    role: "teacher",
  });

  if (profileError) {
    console.error("Failed to save teacher profile.", profileError);
    await deletePartialUser(authData.user.id);
    return failure("تعذر حفظ ملف المدرس.", undefined, values);
  }

  const { error: teacherError } = await admin.from("teachers").insert({
    profile_id: authData.user.id,
    subject: parsed.data.subject,
    is_active: true,
  });

  if (teacherError) {
    console.error("Failed to save teacher record.", teacherError);
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
