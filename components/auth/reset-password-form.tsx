"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { resetPasswordAction } from "@/lib/auth/actions";
import { resetPasswordSchema } from "@/lib/validations/auth";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const inputClassName =
  "border-border bg-background focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-2.5 outline-none transition focus:ring-4";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialActionState,
  );
  const {
    register,
    trigger,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
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
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold">كلمة المرور الجديدة</span>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className={inputClassName}
        />
        {(errors.password?.message ?? state.fieldErrors?.password?.[0]) ? (
          <p className="text-danger text-sm">
            {errors.password?.message ?? state.fieldErrors?.password?.[0]}
          </p>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">تأكيد كلمة المرور</span>
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          className={inputClassName}
        />
        {(errors.confirmPassword?.message ??
        state.fieldErrors?.confirmPassword?.[0]) ? (
          <p className="text-danger text-sm">
            {errors.confirmPassword?.message ??
              state.fieldErrors?.confirmPassword?.[0]}
          </p>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary-600 w-full rounded-md px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جاري الحفظ..." : "حفظ كلمة المرور"}
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
