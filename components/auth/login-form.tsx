"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { initialActionState, type ActionState } from "@/lib/auth/action-state";
import { loginAction } from "@/lib/auth/actions";
import { loginSchema } from "@/lib/validations/auth";
import { PasswordInput } from "./password-tools";

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  notice?: string;
};

function FieldError({
  client,
  server,
}: {
  client?: string;
  server?: string[];
}) {
  const message = client ?? server?.[0];

  if (!message) {
    return null;
  }

  return (
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
      {message}
    </p>
  );
}

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
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
  );
}

export function LoginForm({ notice }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialActionState,
  );
  const {
    register,
    trigger,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    values: {
      email: state.values?.email ?? "",
      password: state.values?.password ?? "",
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
      {notice ? (
        <div
          className="animate-slide-down text-primary-700 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            background:
              "linear-gradient(135deg, rgb(231 245 241 / 0.8), rgb(197 232 223 / 0.5))",
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {notice}
        </div>
      ) : null}
      <StatusMessage state={state} />

      <label className="block space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          الإيميل
        </span>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          autoFocus
          className="field bg-background/60 py-2.5"
        />
        <FieldError
          client={errors.email?.message}
          server={state.fieldErrors?.email}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          كلمة المرور
        </span>
        <PasswordInput<LoginValues>
          name="password"
          register={register}
          autoComplete="current-password"
          className="field bg-background/60 py-2.5"
        />
        <FieldError
          client={errors.password?.message}
          server={state.fieldErrors?.password}
        />
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
            جاري الدخول...
          </>
        ) : (
          "دخول"
        )}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="text-primary-700 hover:text-primary-500 font-bold transition-all duration-300 hover:translate-x-[-2px]"
        >
          نسيت كلمة المرور؟
        </Link>
        <Link
          href="/signup"
          className="text-primary-700 hover:text-primary-500 font-bold transition-all duration-300 hover:translate-x-[-2px]"
        >
          إنشاء حساب طالب
        </Link>
      </div>
    </form>
  );
}
