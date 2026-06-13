"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { forgotPasswordSchema } from "@/lib/validations/auth";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const inputClassName =
  "border-border bg-background focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-2.5 outline-none transition focus:ring-4";

export function ForgotPasswordForm() {
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
        <p
          className={
            state.status === "success"
              ? "bg-primary-50 text-primary-700 rounded-md px-3 py-2 text-sm"
              : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold">الإيميل</span>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className={inputClassName}
        />
        {(errors.email?.message ?? state.fieldErrors?.email?.[0]) ? (
          <p className="text-danger text-sm">
            {errors.email?.message ?? state.fieldErrors?.email?.[0]}
          </p>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary-600 w-full rounded-md px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
      </button>

      <Link
        href="/login"
        className="text-primary-700 block text-sm font-semibold"
      >
        الرجوع لتسجيل الدخول
      </Link>
    </form>
  );
}
