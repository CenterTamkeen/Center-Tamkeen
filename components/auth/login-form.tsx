"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { initialActionState, type ActionState } from "@/lib/auth/action-state";
import { loginAction } from "@/lib/auth/actions";
import { loginSchema } from "@/lib/validations/auth";

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  notice?: string;
};

const inputClassName =
  "border-border bg-background focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-2.5 outline-none transition focus:ring-4";

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

  return <p className="text-danger text-sm">{message}</p>;
}

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "bg-primary-50 text-primary-700 rounded-md px-3 py-2 text-sm"
          : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      }
    >
      {state.message}
    </p>
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
        <p className="bg-primary-50 text-primary-700 rounded-md px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}
      <StatusMessage state={state} />

      <label className="block space-y-2">
        <span className="text-sm font-semibold">الإيميل</span>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className={inputClassName}
        />
        <FieldError
          client={errors.email?.message}
          server={state.fieldErrors?.email}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">كلمة المرور</span>
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className={inputClassName}
        />
        <FieldError
          client={errors.password?.message}
          server={state.fieldErrors?.password}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary-600 w-full rounded-md px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جاري الدخول..." : "دخول"}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="text-primary-700 font-semibold"
        >
          نسيت كلمة المرور؟
        </Link>
        <Link href="/signup" className="text-primary-700 font-semibold">
          إنشاء حساب طالب
        </Link>
      </div>
    </form>
  );
}
