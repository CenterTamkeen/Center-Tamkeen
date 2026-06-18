"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { forgotPasswordSchema } from "@/lib/validations/auth";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialActionState,
  );
  const {
    register,
    trigger,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    values: {
      email: state.values?.email ?? emailParam,
    },
  });

  return (
    <form
      action={formAction}
      className="space-y-5"
      onSubmit={async (event) => {
        const valid = await trigger();

        if (!valid) {
          event.preventDefault();
        }
      }}
    >
      {state.message ? (
        <div
          className={`animate-slide-down flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            state.status === "success" ? "text-primary-700" : "text-red-700"
          }`}
          style={{
            background:
              state.status === "success"
                ? "linear-gradient(135deg, rgb(231 245 241 / 0.8), rgb(197 232 223 / 0.5))"
                : "linear-gradient(135deg, rgb(254 226 226 / 0.8), rgb(254 202 202 / 0.5))",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {state.status === "success" ? (
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
          {state.message}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          الإيميل
        </span>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className="field bg-background/60 py-2.5"
        />
        {(errors.email?.message ?? state.fieldErrors?.email?.[0]) ? (
          <p className="animate-slide-down text-danger flex items-center gap-1.5 text-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {errors.email?.message ?? state.fieldErrors?.email?.[0]}
          </p>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full gap-2 py-3.5"
      >
        {isPending ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            جاري الإرسال...
          </>
        ) : (
          "إرسال رابط الاستعادة"
        )}
      </button>

      <Link
        href="/login"
        className="text-primary-700 hover:text-primary-500 block text-sm font-bold transition-all duration-300 hover:translate-x-[-2px]"
      >
        الرجوع لتسجيل الدخول
      </Link>
    </form>
  );
}
