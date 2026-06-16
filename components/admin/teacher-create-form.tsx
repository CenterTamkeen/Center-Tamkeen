"use client";

import { useActionState } from "react";

import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";
import { createTeacherAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/auth/action-state";

export function TeacherCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createTeacherAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="card-modern space-y-6 p-6 sm:p-7">
      <div>
        <p className="eyebrow">إضافة مدرس</p>
        <h2 className="text-lg font-black">حساب مدرس جديد</h2>
      </div>

      <FormFeedback state={state} />

      <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
        <label className="grid min-w-0 gap-2.5">
          <span className="text-foreground/80 text-sm font-semibold">
            اسم المدرس
          </span>
          <input
            name="fullName"
            defaultValue={state.values?.fullName ?? ""}
            className="field bg-background/60 min-w-0 py-3"
          />
          <ErrorText message={state.fieldErrors?.fullName?.[0]} />
        </label>

        <label className="grid min-w-0 gap-2.5">
          <span className="text-foreground/80 text-sm font-semibold">
            المادة
          </span>
          <input
            name="subject"
            defaultValue={state.values?.subject ?? ""}
            className="field bg-background/60 min-w-0 py-3"
          />
          <ErrorText message={state.fieldErrors?.subject?.[0]} />
        </label>

        <label className="grid min-w-0 gap-2.5">
          <span className="text-foreground/80 text-sm font-semibold">
            الإيميل
          </span>
          <input
            name="email"
            type="email"
            defaultValue={state.values?.email ?? ""}
            className="field bg-background/60 min-w-0 py-3 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.email?.[0]} />
        </label>

        <label className="grid min-w-0 gap-2.5">
          <span className="text-foreground/80 text-sm font-semibold">
            الباسورد
          </span>
          <input
            name="password"
            type="password"
            className="field bg-background/60 min-w-0 py-3 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.password?.[0]} />
        </label>
      </div>

      <label className="grid min-w-0 gap-2.5">
        <span className="text-foreground/80 text-sm font-semibold">
          صورة المدرس
        </span>
        <input
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field bg-background/60 min-w-0 py-3"
        />
        <p className="text-foreground/50 text-xs font-semibold">
          اختياري: JPG أو PNG أو WebP بحد أقصى 2MB.
        </p>
        <ErrorText message={state.fieldErrors?.avatar?.[0]} />
      </label>

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "جاري إضافة المدرس..." : "إضافة المدرس"}
      </button>
    </form>
  );
}
