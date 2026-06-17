"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";
import { createTeacherAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/auth/action-state";

export function TeacherCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const submitLockedRef = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createTeacherAction,
    initialActionState,
  );

  useEffect(() => {
    submitLockedRef.current = false;

    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card-modern space-y-6 p-6 sm:p-7"
      onSubmit={(event) => {
        if (isPending || submitLockedRef.current) {
          event.preventDefault();
          return;
        }

        submitLockedRef.current = true;
      }}
    >
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
            الاسم بالإنجليزي للرابط
          </span>
          <input
            name="englishName"
            defaultValue={state.values?.englishName ?? ""}
            className="field bg-background/60 min-w-0 py-3 text-left"
            dir="ltr"
            placeholder="Ahmed Mohamed"
          />
          <ErrorText message={state.fieldErrors?.englishName?.[0]} />
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
            رقم التليفون
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={state.values?.phone ?? ""}
            className="field bg-background/60 min-w-0 py-3 text-left"
            dir="ltr"
            placeholder="01xxxxxxxxx"
          />
          <ErrorText message={state.fieldErrors?.phone?.[0]} />
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
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              className="field bg-background/60 min-w-0 py-3 pe-11 text-left"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-foreground/55 hover:text-primary-700 absolute inset-y-1 left-1 inline-flex w-9 items-center justify-center rounded-lg transition"
              aria-label={showPassword ? "إخفاء الباسورد" : "إظهار الباسورد"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7-1 2.24-2.73 4.16-4.94 5.32" />
                  <path d="M6.61 6.61C4.62 7.88 3.06 9.78 2 12c1.73 3.89 6 7 10 7a10.8 10.8 0 0 0 4.39-.93" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
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
