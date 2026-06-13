"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { studentSignUpAction } from "@/lib/auth/actions";
import {
  gradeLabels,
  sectionLabels,
  sectionsByGrade,
  studentSignUpClientSchema,
} from "@/lib/validations/auth";

type StudentSignUpValues = z.infer<typeof studentSignUpClientSchema>;
type GradeKey = keyof typeof sectionsByGrade;
type FieldName = keyof StudentSignUpValues;

const inputClassName =
  "border-border bg-surface focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-3 outline-none transition focus:ring-4";
const selectClassName =
  "border-border bg-surface focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-3 outline-none transition focus:ring-4";
const sectionClassName =
  "border-border bg-surface-muted/50 space-y-5 rounded-md border p-4 sm:p-5";
function getError(
  name: FieldName,
  errors: ReturnType<
    typeof useForm<StudentSignUpValues>
  >["formState"]["errors"],
  serverErrors?: Record<string, string[]>,
) {
  const clientMessage = errors[name]?.message;

  if (typeof clientMessage === "string") {
    return clientMessage;
  }

  return serverErrors?.[name]?.[0];
}

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-danger text-sm">{message}</p>;
}

export function StudentSignUpForm() {
  const [state, formAction, isPending] = useActionState(
    studentSignUpAction,
    initialActionState,
  );
  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<StudentSignUpValues>({
    resolver: zodResolver(studentSignUpClientSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      studentPhone: "",
      fatherPhone: "",
      schoolName: "",
      gender: "",
      grade: "",
      section: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const selectedGrade = useWatch({
    control,
    name: "grade",
  }) as GradeKey | "";
  const [photoName, setPhotoName] = useState("لم يتم اختيار صورة");
  const photoField = register("photo", {
    onChange(event) {
      const file = event.target.files?.[0];
      setPhotoName(file?.name ?? "لم يتم اختيار صورة");
    },
  });
  const availableSections = useMemo(() => {
    if (!selectedGrade) {
      return [];
    }

    return sectionsByGrade[selectedGrade] ?? [];
  }, [selectedGrade]);

  useEffect(() => {
    setValue("section", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [selectedGrade, setValue]);

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

      <div className="space-y-5">
        <section className={sectionClassName}>
          <div className="border-border border-b pb-3">
            <h2 className="font-bold">بيانات الطالب</h2>
            <p className="text-foreground/60 mt-1 text-sm">
              الاسم، أرقام التواصل، والمدرسة.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">اسم الطالب الرباعي</span>
              <input {...register("fullName")} className={inputClassName} />
              <ErrorText
                message={getError("fullName", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">رقم تليفون الطالب</span>
              <input
                {...register("studentPhone")}
                inputMode="tel"
                className={`${inputClassName} text-right`}
              />
              <ErrorText
                message={getError("studentPhone", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">
                رقم تليفون ولي الأمر
              </span>
              <input
                {...register("fatherPhone")}
                inputMode="tel"
                className={`${inputClassName} text-right`}
              />
              <ErrorText
                message={getError("fatherPhone", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">اسم المدرسة</span>
              <input {...register("schoolName")} className={inputClassName} />
              <ErrorText
                message={getError("schoolName", errors, state.fieldErrors)}
              />
            </label>
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="border-border border-b pb-3">
            <h2 className="font-bold">المرحلة الدراسية</h2>
            <p className="text-foreground/60 mt-1 text-sm">
              الشعبة بتتغير تلقائيًا حسب السنة الدراسية.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">النوع</span>
              <select {...register("gender")} className={selectClassName}>
                <option value="">اختار النوع</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <ErrorText
                message={getError("gender", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">السنة الدراسية</span>
              <select {...register("grade")} className={selectClassName}>
                <option value="">اختار السنة</option>
                {Object.entries(gradeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ErrorText
                message={getError("grade", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">الشعبة</span>
              <select
                {...register("section")}
                disabled={!selectedGrade}
                className={`${selectClassName} disabled:bg-surface-muted disabled:cursor-not-allowed`}
              >
                <option value="">اختار الشعبة</option>
                {availableSections.map((value) => (
                  <option key={value} value={value}>
                    {sectionLabels[value]}
                  </option>
                ))}
              </select>
              <ErrorText
                message={getError("section", errors, state.fieldErrors)}
              />
            </label>
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="border-border border-b pb-3">
            <h2 className="font-bold">بيانات الحساب</h2>
            <p className="text-foreground/60 mt-1 text-sm">
              الإيميل، كلمة المرور، وصورة الطالب.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">صورة الطالب</span>
              <div className="border-border bg-surface flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-foreground/60 min-w-0 truncate text-sm">
                  {photoName}
                </span>
                <label className="bg-primary text-primary-foreground hover:bg-primary-600 cursor-pointer rounded-md px-3 py-2 text-sm font-bold transition">
                  اختيار صورة
                  <input
                    {...photoField}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                  />
                </label>
              </div>
              <ErrorText
                message={getError("photo", errors, state.fieldErrors)}
              />
            </div>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">الإيميل</span>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className={inputClassName}
              />
              <ErrorText
                message={getError("email", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">كلمة المرور</span>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                className={inputClassName}
              />
              <ErrorText
                message={getError("password", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">تأكيد كلمة المرور</span>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                className={inputClassName}
              />
              <ErrorText
                message={getError("confirmPassword", errors, state.fieldErrors)}
              />
            </label>
          </div>
        </section>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary-600 w-full rounded-md px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب الطالب"}
      </button>

      <Link
        href="/login"
        className="text-primary-700 block text-center text-sm font-bold"
      >
        عندك حساب بالفعل؟ سجل دخول
      </Link>
    </form>
  );
}
