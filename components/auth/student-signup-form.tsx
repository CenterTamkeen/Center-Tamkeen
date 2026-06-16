"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { studentSignUpAction } from "@/lib/auth/actions";
import {
  getStudentPhotoValidationMessage,
  gradeLabels,
  sectionLabels,
  sectionsByGrade,
  studentSignUpClientSchema,
} from "@/lib/validations/auth";
import { PasswordInput, PasswordStrength } from "./password-tools";

type StudentSignUpValues = z.infer<typeof studentSignUpClientSchema>;
type GradeKey = keyof typeof sectionsByGrade;
type FieldName = keyof StudentSignUpValues;

const inputClassName = "field bg-background/60";
const selectClassName = "field bg-background/60";
const sectionClassName = "glass-panel space-y-5 rounded-xl p-5 sm:p-6";

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

export function StudentSignUpForm() {
  const [state, formAction, isPending] = useActionState(
    studentSignUpAction,
    initialActionState,
  );
  const formValues = {
    fullName: state.values?.fullName ?? "",
    studentPhone: state.values?.studentPhone ?? "",
    fatherPhone: state.values?.fatherPhone ?? "",
    schoolName: state.values?.schoolName ?? "",
    gender: state.values?.gender ?? "",
    grade: state.values?.grade ?? "",
    section: state.values?.section ?? "",
    email: state.values?.email ?? "",
    password: state.values?.password ?? "",
    confirmPassword: state.values?.confirmPassword ?? "",
    photo: undefined,
  };
  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<StudentSignUpValues>({
    resolver: zodResolver(studentSignUpClientSchema),
    mode: "onBlur",
    defaultValues: formValues,
    values: formValues,
  });
  const selectedGrade = useWatch({
    control,
    name: "grade",
  }) as GradeKey | "";
  const selectedSection = useWatch({
    control,
    name: "section",
  });
  const [photoName, setPhotoName] = useState("لم يتم اختيار صورة");
  const [photoError, setPhotoError] = useState<string>();
  const photoField = register("photo", {
    onChange(event) {
      const file = event.target.files?.[0];
      setPhotoName(file?.name ?? "لم يتم اختيار صورة");
      setPhotoError(getStudentPhotoValidationMessage(file) ?? undefined);
    },
  });
  const availableSections = useMemo(() => {
    if (!selectedGrade) {
      return [];
    }

    return sectionsByGrade[selectedGrade] ?? [];
  }, [selectedGrade]);

  useEffect(() => {
    if (
      selectedGrade &&
      selectedSection &&
      !sectionsByGrade[selectedGrade]?.includes(selectedSection as never)
    ) {
      setValue("section", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [selectedGrade, selectedSection, setValue]);

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={async (event) => {
        const formData = new FormData(event.currentTarget);
        const photoMessage = getStudentPhotoValidationMessage(
          formData.get("photo"),
        );

        setPhotoError(photoMessage ?? undefined);

        if (photoMessage) {
          event.preventDefault();
          return;
        }

        const valid = await trigger();

        if (!valid) {
          event.preventDefault();
        }
      }}
    >
      {state.message ? (
        <div
          className="animate-slide-down flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-700"
          style={{
            background:
              "linear-gradient(135deg, rgb(254 226 226 / 0.8), rgb(254 202 202 / 0.5))",
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {state.message}
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Section 1: Student data */}
        <section className={sectionClassName}>
          <div
            className="border-b pb-3"
            style={{ borderColor: "rgb(208 227 218 / 0.5)" }}
          >
            <h2 className="flex items-center gap-2 font-bold">
              <span
                className="text-primary-foreground flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                }}
              >
                ١
              </span>
              بيانات الطالب
            </h2>
            <p className="text-foreground/55 mt-1 text-sm">
              الاسم، أرقام التواصل، والمدرسة.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-foreground/80 text-sm font-semibold">
                اسم الطالب الرباعي
              </span>
              <input
                {...register("fullName")}
                autoFocus
                className={inputClassName}
              />
              <ErrorText
                message={getError("fullName", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                رقم تليفون الطالب
              </span>
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
              <span className="text-foreground/80 text-sm font-semibold">
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
              <span className="text-foreground/80 text-sm font-semibold">
                اسم المدرسة
              </span>
              <input {...register("schoolName")} className={inputClassName} />
              <ErrorText
                message={getError("schoolName", errors, state.fieldErrors)}
              />
            </label>
          </div>
        </section>

        {/* Section 2: Academic info */}
        <section className={sectionClassName}>
          <div
            className="border-b pb-3"
            style={{ borderColor: "rgb(208 227 218 / 0.5)" }}
          >
            <h2 className="flex items-center gap-2 font-bold">
              <span
                className="text-primary-foreground flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                }}
              >
                ٢
              </span>
              المرحلة الدراسية
            </h2>
            <p className="text-foreground/55 mt-1 text-sm">
              الشعبة بتتغير تلقائيًا حسب السنة الدراسية.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                النوع
              </span>
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
              <span className="text-foreground/80 text-sm font-semibold">
                السنة الدراسية
              </span>
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
              <span className="text-foreground/80 text-sm font-semibold">
                الشعبة
              </span>
              <select
                {...register("section")}
                disabled={!selectedGrade}
                className={`${selectClassName} disabled:cursor-not-allowed disabled:opacity-50`}
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

        {/* Section 3: Account info */}
        <section className={sectionClassName}>
          <div
            className="border-b pb-3"
            style={{ borderColor: "rgb(208 227 218 / 0.5)" }}
          >
            <h2 className="flex items-center gap-2 font-bold">
              <span
                className="text-primary-foreground flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                }}
              >
                ٣
              </span>
              بيانات الحساب
            </h2>
            <p className="text-foreground/55 mt-1 text-sm">
              الإيميل، كلمة المرور، وصورة الطالب.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <span className="text-foreground/80 text-sm font-semibold">
                صورة الطالب{" "}
                <span className="text-foreground/50 font-normal">
                  (اختياري)
                </span>
              </span>
              <div
                className="bg-background/60 flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-2.5"
                style={{ borderColor: "rgb(208 227 218 / 0.7)" }}
              >
                <span className="text-foreground/55 min-w-0 truncate text-sm">
                  {photoName}
                </span>
                <label className="btn-primary cursor-pointer px-3 py-2 text-xs">
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
                message={
                  photoError ?? getError("photo", errors, state.fieldErrors)
                }
              />
            </div>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-foreground/80 text-sm font-semibold">
                الإيميل
              </span>
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
              <span className="text-foreground/80 text-sm font-semibold">
                كلمة المرور
              </span>
              <PasswordInput<StudentSignUpValues>
                name="password"
                register={register}
                autoComplete="new-password"
                className={inputClassName}
              />
              <PasswordStrength<StudentSignUpValues>
                control={control}
                name="password"
              />
              <ErrorText
                message={getError("password", errors, state.fieldErrors)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                تأكيد كلمة المرور
              </span>
              <PasswordInput<StudentSignUpValues>
                name="confirmPassword"
                register={register}
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
            جاري إنشاء الحساب...
          </>
        ) : (
          "إنشاء حساب الطالب"
        )}
      </button>

      <Link
        href="/login"
        className="text-primary-700 hover:text-primary-500 block text-center text-sm font-bold transition-all duration-300"
      >
        عندك حساب بالفعل؟ سجل دخول
      </Link>
    </form>
  );
}
