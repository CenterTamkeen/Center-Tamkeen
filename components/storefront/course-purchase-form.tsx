"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  applyCourseCouponAction,
  createCourseOrderAction,
} from "@/lib/storefront/actions";

type CoursePurchaseFormProps = {
  courseId: string;
  courseHref: string;
  price: number;
  isStudent: boolean;
  isEnrolled?: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function CoursePurchaseForm({
  courseId,
  courseHref,
  price,
  isStudent,
  isEnrolled = false,
}: CoursePurchaseFormProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponState, applyCouponAction, isApplying] = useActionState(
    applyCourseCouponAction,
    initialActionState,
  );
  const [orderState, createOrderAction, isOrdering] = useActionState(
    createCourseOrderAction,
    initialActionState,
  );
  const appliedCouponCode = couponState.values?.couponCode ?? "";
  const couponStillApplied =
    couponState.status === "success" &&
    appliedCouponCode.length > 0 &&
    couponCode.trim().toUpperCase() === appliedCouponCode;
  const discountAmount = couponStillApplied
    ? Number(couponState.values?.discountAmount ?? 0)
    : 0;
  const finalPrice = couponStillApplied
    ? Number(couponState.values?.finalPrice ?? price)
    : price;

  if (!isStudent) {
    return (
      <a
        href="/login"
        className="btn-primary flex w-full justify-center py-3.5"
      >
        سجّل كطالب للشراء
      </a>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-white/65 p-4">
          <p className="text-primary-700 text-sm font-black">
            أنت مشترك بالفعل في هذا الكورس.
          </p>
          <p className="text-foreground/60 mt-1 text-sm leading-6">
            تقدر ترجع لمحتوى الكورس وتكمل من آخر درس.
          </p>
        </div>
        <Link
          href={`${courseHref}#study`}
          className="btn-primary flex w-full justify-center py-3.5"
        >
          اكمل الدراسة
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={applyCouponAction} className="grid gap-3">
        <input type="hidden" name="courseId" value={courseId} />
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-bold">
            كود الخصم
          </span>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              name="couponCode"
              value={couponCode}
              onChange={(event) =>
                setCouponCode(event.currentTarget.value.toUpperCase())
              }
              placeholder="اكتب الكوبون"
              className="field bg-background/60 py-2.5 text-left uppercase"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={isApplying || !couponCode.trim()}
              className="btn-secondary px-4 py-2.5"
            >
              {isApplying ? "جاري..." : "تطبيق"}
            </button>
          </div>
        </label>
        {couponState.message ? (
          <p
            className={`text-sm font-semibold ${
              couponState.status === "success"
                ? "text-primary-700"
                : "text-red-700"
            }`}
          >
            {couponState.message}
          </p>
        ) : null}
      </form>

      <div className="rounded-xl border bg-white/65 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground/60 font-semibold">السعر الأصلي</span>
          <span className="font-black">{formatPrice(price)}</span>
        </div>
        {discountAmount > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-primary-700 font-semibold">الخصم</span>
            <span className="text-primary-700 font-black">
              - {formatPrice(discountAmount)}
            </span>
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <span className="font-black">الإجمالي بعد الخصم</span>
          <span className="text-primary-700 text-lg font-black">
            {formatPrice(finalPrice)}
          </span>
        </div>
      </div>

      <form action={createOrderAction} className="space-y-3">
        <input type="hidden" name="courseId" value={courseId} />
        <input
          type="hidden"
          name="couponCode"
          value={couponStillApplied ? appliedCouponCode : ""}
        />
        <button
          type="submit"
          disabled={isOrdering}
          className="btn-primary flex w-full justify-center gap-2 py-3.5"
        >
          {isOrdering ? "جاري إنشاء الطلب..." : "اطلب الكورس"}
        </button>
        {orderState.message ? (
          <p
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              orderState.status === "success"
                ? "bg-primary-50 text-primary-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {orderState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
