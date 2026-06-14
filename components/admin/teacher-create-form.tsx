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
    <form action={formAction} className="card-modern space-y-5 p-5">
      <div>
        <p className="eyebrow">إضافة مدرس</p>
        <h2 className="text-lg font-black">حساب مدرس جديد</h2>
      </div>

      <FormFeedback state={state} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            اسم المدرس
          </span>
          <input
            name="fullName"
            defaultValue={state.values?.fullName ?? ""}
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.fullName?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            المادة
          </span>
          <input
            name="subject"
            defaultValue={state.values?.subject ?? ""}
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.subject?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الإيميل
          </span>
          <input
            name="email"
            type="email"
            defaultValue={state.values?.email ?? ""}
            className="field bg-background/60 py-2.5 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.email?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الباسورد
          </span>
          <input
            name="password"
            type="password"
            className="field bg-background/60 py-2.5 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.password?.[0]} />
        </label>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "جاري إضافة المدرس..." : "إضافة المدرس"}
      </button>
    </form>
  );
}
