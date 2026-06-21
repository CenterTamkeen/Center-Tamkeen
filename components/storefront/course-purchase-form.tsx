"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { redeemCourseActivationCodeAction } from "@/lib/storefront/actions";

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
  const [activationCode, setActivationCode] = useState("");
  const [activationState, redeemAction, isRedeeming] = useActionState(
    redeemCourseActivationCodeAction,
    initialActionState,
  );

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
      <div className="rounded-xl border bg-white/65 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground/60 font-semibold">سعر الكورس</span>
          <span className="font-black">{formatPrice(price)}</span>
        </div>
        <p className="text-foreground/60 mt-3 text-sm leading-6">
          بعد الدفع مع فريق تمكين على واتساب أو تليجرام، هتاخد كود تفعيل خاص
          بالكورس وتدخله هنا.
        </p>
      </div>

      <form action={redeemAction} className="space-y-3">
        <input type="hidden" name="courseId" value={courseId} />
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-bold">
            كود تفعيل الكورس
          </span>
          <input
            name="activationCode"
            value={activationCode}
            onChange={(event) =>
              setActivationCode(
                event.currentTarget.value.replace(/\D/g, "").slice(0, 6),
              )
            }
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="field bg-background/60 py-3 text-center text-lg font-black tracking-[0.25em]"
            dir="ltr"
          />
        </label>
        <button
          type="submit"
          disabled={isRedeeming || activationCode.length !== 6}
          className="btn-primary flex w-full justify-center gap-2 py-3.5"
        >
          {isRedeeming ? "جاري التفعيل..." : "فعّل الكورس"}
        </button>
        {activationState.message ? (
          <p
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              activationState.status === "success"
                ? "bg-primary-50 text-primary-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {activationState.message}
          </p>
        ) : null}
        {activationState.status === "success" ? (
          <Link
            href={`${courseHref}#study`}
            className="btn-secondary flex w-full justify-center py-3"
          >
            افتح محتوى الكورس
          </Link>
        ) : null}
      </form>
    </div>
  );
}
