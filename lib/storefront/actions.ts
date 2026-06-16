"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { requireRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/storefront/data";
import type { Database } from "@/types/database";

type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];
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

function calculateDiscount(coursePrice: number, coupon: CouponRow) {
  const rawDiscount =
    coupon.discount_type === "percentage"
      ? (coursePrice * coupon.discount_value) / 100
      : coupon.discount_value;

  return Math.min(coursePrice, Math.max(0, Math.round(rawDiscount)));
}

async function getStudentAndCourse(profileId: string, courseId: string) {
  const admin = getAdminClient();

  if (!admin) {
    return {
      error: "إعدادات الدفع غير مكتملة.",
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

async function validateCouponForStudent(
  course: CourseRow,
  student: StudentRow,
  code: string,
) {
  const admin = getAdminClient();

  if (!admin) {
    return { error: "إعدادات الدفع غير مكتملة.", coupon: null };
  }

  const { data: coupon, error } = await admin
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("course_id", course.id)
    .eq("teacher_id", course.teacher_id)
    .maybeSingle();

  if (error) {
    return {
      error:
        "تحديث قاعدة البيانات الخاص بربط الكوبون بالكورس لسه متطبقش. طبق آخر migration.",
      coupon: null,
    };
  }

  if (!coupon) {
    return {
      error: "الكوبون غير موجود لهذا الكورس.",
      coupon: null,
    };
  }

  if (!coupon.is_active) {
    return { error: "الكوبون غير مفعل.", coupon: null };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
    return { error: "الكوبون منتهي.", coupon: null };
  }

  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return { error: "الكوبون وصل لحد الاستخدام.", coupon: null };
  }

  const { data: targets, error: targetsError } = await admin
    .from("coupon_student_targets")
    .select("student_id")
    .eq("coupon_id", coupon.id);

  if (targetsError) {
    return {
      error:
        "تحديث قاعدة البيانات الخاص بتحديد الطلاب للكوبون لسه متطبقش. طبق آخر migration.",
      coupon: null,
    };
  }

  const targetIds = (targets ?? []).map((target) => target.student_id);

  if (targetIds.length > 0 && !targetIds.includes(student.id)) {
    return { error: "الكوبون غير متاح لحسابك.", coupon: null };
  }

  return { error: null, coupon: coupon as CouponRow };
}

export async function applyCourseCouponAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole("student", "/dashboard/student");
  const courseId = getString(formData, "courseId");
  const code = getString(formData, "couponCode");
  const context = await getStudentAndCourse(profile.id, courseId);

  if (context.error || !context.student || !context.course) {
    return failure(context.error ?? "تعذر تجهيز بيانات الكورس.");
  }

  if (!code) {
    return failure("اكتب كود الخصم الأول.", {
      couponCode: ["اكتب كود الخصم."],
    });
  }

  const validation = await validateCouponForStudent(
    context.course,
    context.student,
    code,
  );

  if (validation.error || !validation.coupon) {
    return failure(validation.error ?? "الكوبون غير صالح.", {
      couponCode: [validation.error ?? "الكوبون غير صالح."],
    });
  }

  const discountAmount = calculateDiscount(
    context.course.price,
    validation.coupon,
  );
  const finalPrice = Math.max(0, context.course.price - discountAmount);

  return success("تم تطبيق الكوبون.", {
    couponCode: validation.coupon.code,
    couponId: validation.coupon.id,
    discountAmount: String(discountAmount),
    finalPrice: String(finalPrice),
  });
}

export async function createCourseOrderAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireRole("student", "/dashboard/student");
  const courseId = getString(formData, "courseId");
  const couponCode = getString(formData, "couponCode");
  const context = await getStudentAndCourse(profile.id, courseId);

  if (context.error || !context.student || !context.course || !context.admin) {
    return failure(context.error ?? "تعذر تجهيز الطلب.");
  }

  const { data: existingEnrollment } = await context.admin
    .from("enrollments")
    .select("id")
    .eq("student_id", context.student.id)
    .eq("course_id", context.course.id)
    .maybeSingle();

  if (existingEnrollment) {
    return failure("أنت مشترك بالفعل في هذا الكورس.");
  }

  let coupon: CouponRow | null = null;
  let discountAmount = 0;

  if (couponCode) {
    const validation = await validateCouponForStudent(
      context.course,
      context.student,
      couponCode,
    );

    if (validation.error || !validation.coupon) {
      return failure(validation.error ?? "الكوبون غير صالح.", {
        couponCode: [validation.error ?? "الكوبون غير صالح."],
      });
    }

    coupon = validation.coupon;
    discountAmount = calculateDiscount(context.course.price, coupon);
  }

  const finalPrice = Math.max(0, context.course.price - discountAmount);
  const { data: order, error: orderError } = await context.admin
    .from("orders")
    .insert({
      student_id: context.student.id,
      total_amount: finalPrice,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return failure("تعذر إنشاء الطلب.");
  }

  const { error: itemError } = await context.admin.from("order_items").insert({
    order_id: order.id,
    course_id: context.course.id,
    price_at_purchase: finalPrice,
  });

  if (itemError) {
    await context.admin.from("orders").delete().eq("id", order.id);
    return failure("تعذر إضافة الكورس للطلب.");
  }

  if (coupon) {
    const { error: redemptionError } = await context.admin
      .from("coupon_redemptions")
      .insert({
        coupon_id: coupon.id,
        student_id: context.student.id,
        order_id: order.id,
        discount_amount: discountAmount,
      });

    if (redemptionError) {
      await context.admin.from("order_items").delete().eq("order_id", order.id);
      await context.admin.from("orders").delete().eq("id", order.id);
      return failure(
        "تعذر تسجيل استخدام الكوبون. تأكد من تطبيق آخر migration.",
      );
    }
  }

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/admin/orders");

  return success(
    `تم إنشاء الطلب بسعر ${formatPrice(finalPrice)}. في انتظار تأكيد الإدارة.`,
    {
      finalPrice: String(finalPrice),
      orderId: order.id,
    },
  );
}
