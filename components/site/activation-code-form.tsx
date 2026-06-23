"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import type { AppRole } from "@/lib/auth/roles";
import { redeemAnyCourseActivationCodeAction } from "@/lib/storefront/actions";
import { WhatsappContactList } from "@/components/site/whatsapp-contact-list";

type ActivationCodeFormProps = {
  userRole: AppRole | null;
  dashboardHref: string | null;
};

const activationCodeWhatsappMessage =
  "أهلا تمكين، محتاج كود تفعيل لكورس على المنصة.";

export function ActivationCodeForm({
  userRole,
  dashboardHref,
}: ActivationCodeFormProps) {
  const [activationCode, setActivationCode] = useState("");
  const [state, formAction, isPending] = useActionState(
    redeemAnyCourseActivationCodeAction,
    initialActionState,
  );
  const isStudent = userRole === "student";
  const isLoggedIn = Boolean(userRole);
  const courseHref = state.values?.courseHref;
  const courseTitle = state.values?.courseTitle;

  if (!isLoggedIn) {
    return (
      <div className="glass-panel-strong mx-auto w-full max-w-xl rounded-xl p-5 sm:p-6">
        <p className="text-foreground/65 text-sm leading-7">
          لازم تسجل دخول بحساب طالب الأول، وبعدها تقدر تدخل كود التفعيل اللي
          وصلك من فريق تمكين.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login?next=%2Factivate-code"
            className="btn-primary py-3"
          >
            تسجيل الدخول
          </Link>
          <Link href="/signup" className="btn-secondary py-3">
            حساب طالب
          </Link>
        </div>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="glass-panel-strong mx-auto w-full max-w-xl rounded-xl p-5 sm:p-6">
        <p className="text-foreground/65 text-sm leading-7">
          تفعيل الأكواد متاح لحسابات الطلاب فقط. استخدم حساب طالب عشان تضيف
          الكورس للوحة الطالب.
        </p>
        {dashboardHref ? (
          <Link href={dashboardHref} className="btn-secondary mt-5 w-full py-3">
            الرجوع للوحة
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <form
        action={formAction}
        className="glass-panel-strong rounded-xl p-5 sm:p-6"
      >
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-bold">
            كود التفعيل
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
            className="field bg-background/70 py-4 text-center text-2xl font-black tracking-[0.28em]"
            dir="ltr"
          />
        </label>

        <button
          type="submit"
          disabled={isPending || activationCode.length !== 6}
          className="btn-primary mt-4 flex w-full justify-center py-3.5"
        >
          {isPending ? "جاري التفعيل..." : "فعّل الكورس"}
        </button>

        <div aria-live="polite" className="mt-4 space-y-3">
          {state.message ? (
            <div
              className={`animate-slide-down rounded-xl px-4 py-3 text-sm font-semibold ${
                state.status === "success"
                  ? "bg-primary-50 text-primary-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {state.message}
              {courseTitle ? (
                <p className="mt-1 text-xs opacity-80">الكورس: {courseTitle}</p>
              ) : null}
            </div>
          ) : null}

          {state.status === "success" && courseHref ? (
            <Link
              href={`${courseHref}#study`}
              className="btn-secondary flex w-full justify-center py-3"
            >
              افتح الكورس
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-5">
        <WhatsappContactList message={activationCodeWhatsappMessage} />
      </div>
    </div>
  );
}
