"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { WhatsappContactList } from "@/components/site/whatsapp-contact-list";
import { CodeInput } from "@/components/ui/code-input";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LockOpenIcon,
  LogInIcon,
  PlayCircleIcon,
  PriceTagIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  TicketIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { initialActionState } from "@/lib/auth/action-state";
import { redeemCourseActivationCodeAction } from "@/lib/storefront/actions";

type CoursePurchaseFormProps = {
  courseId: string;
  courseTitle: string;
  courseHref: string;
  price: number;
  isStudent: boolean;
  isEnrolled?: boolean;
};

const CODE_LENGTH = 6;

const purchaseSteps = [
  { icon: WhatsappIcon, title: "كلّم الدعم" },
  { icon: TicketIcon, title: "استلم الكود" },
  { icon: LockOpenIcon, title: "فعّل وابدأ" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function CoursePurchaseForm({
  courseId,
  courseTitle,
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
  const courseActivationWhatsappMessage = `أهلا تمكين، محتاج كود تفعيل لكورس: ${courseTitle}.`;
  const isCodeComplete = activationCode.length === CODE_LENGTH;

  if (!isStudent) {
    return (
      <div className="space-y-3">
        <div className="border-primary-100 bg-primary-50/40 flex items-start gap-3 rounded-2xl border p-4">
          <span className="bg-primary-100/60 text-primary-700 grid size-9 shrink-0 place-items-center rounded-xl">
            <ShieldCheckIcon className="size-4.5" />
          </span>
          <p className="text-foreground/70 text-sm leading-6">
            الاشتراك في الكورسات متاح لحسابات الطلاب، سجّل كطالب وابدأ في دقيقة.
          </p>
        </div>
        <a
          href="/login"
          className="btn-primary flex w-full justify-center gap-2 py-3.5"
        >
          <LogInIcon className="size-4.5" />
          سجّل كطالب للشراء
        </a>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <div className="border-primary-100 bg-primary-50/40 flex items-start gap-3 rounded-2xl border p-4">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
            }}
          >
            <CheckCircleIcon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-primary-700 text-sm font-black">
              أنت مشترك بالفعل في الكورس
            </p>
            <p className="text-foreground/60 mt-1 text-sm leading-6">
              تقدر ترجع لمحتوى الكورس وتكمل من آخر درس.
            </p>
          </div>
        </div>
        <Link
          href={`${courseHref}#study`}
          className="btn-primary flex w-full justify-center gap-2 py-3.5"
        >
          <PlayCircleIcon className="size-4.5" />
          اكمل الدراسة
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-primary-100 bg-primary-50/40 rounded-2xl border p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <PriceTagIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-foreground/55 text-[11px] font-black">
                سعر الكورس
              </p>
              <p className="text-foreground truncate text-xl font-black">
                {formatPrice(price)}
              </p>
            </div>
          </div>
          <span className="chip shrink-0">دفعة واحدة</span>
        </div>

        <ol className="border-primary-100/70 mt-3.5 grid grid-cols-3 gap-2 border-t pt-3">
          {purchaseSteps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="bg-primary-100/60 text-primary-700 relative grid size-8 place-items-center rounded-xl">
                <step.icon className="size-4" />
                <span className="bg-primary-500 text-primary-foreground absolute -top-1 -left-1 grid size-4 place-items-center rounded-full text-[9px] font-black">
                  {index + 1}
                </span>
              </span>
              <p className="text-foreground/70 text-[11px] leading-4 font-bold">
                {step.title}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <WhatsappContactList compact message={courseActivationWhatsappMessage} />

      <form
        action={redeemAction}
        className="border-primary-100 bg-surface/70 space-y-3 rounded-2xl border p-3.5"
      >
        <input type="hidden" name="courseId" value={courseId} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="text-primary-500 size-4" />
            <span className="text-foreground/80 text-sm font-black">
              كود تفعيل الكورس
            </span>
          </div>
          <span className="text-foreground/45 text-[11px] font-bold tabular-nums">
            {activationCode.length}/{CODE_LENGTH}
          </span>
        </div>

        <CodeInput
          name="activationCode"
          value={activationCode}
          onChange={setActivationCode}
          length={CODE_LENGTH}
          label="كود تفعيل الكورس"
          disabled={isRedeeming}
        />

        <button
          type="submit"
          disabled={isRedeeming || !isCodeComplete}
          className="btn-primary flex w-full justify-center gap-2 py-3.5"
        >
          {isRedeeming ? (
            <>
              <SpinnerIcon className="size-4.5" />
              جاري التفعيل...
            </>
          ) : (
            <>
              <LockOpenIcon className="size-4.5" />
              فعّل الكورس
            </>
          )}
        </button>

        <div aria-live="polite" className="space-y-3 empty:hidden">
          {activationState.message ? (
            <p
              className={`animate-slide-down flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                activationState.status === "success"
                  ? "bg-primary-50 text-primary-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {activationState.status === "success" ? (
                <CheckCircleIcon className="mt-0.5 size-4" />
              ) : (
                <AlertCircleIcon className="mt-0.5 size-4" />
              )}
              <span className="min-w-0 flex-1">{activationState.message}</span>
            </p>
          ) : null}

          {activationState.status === "success" ? (
            <Link
              href={`${courseHref}#study`}
              className="btn-secondary flex w-full justify-center gap-2 py-3"
            >
              <PlayCircleIcon className="size-4.5" />
              افتح محتوى الكورس
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
