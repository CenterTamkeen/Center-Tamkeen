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

type StudentSignUpValues = z.infer<typeof studentSignUpClientSchema>;
type GradeKey = keyof typeof sectionsByGrade;
type FieldName = keyof StudentSignUpValues;

const inputClassName = "field";
const selectClassName = "field";
const sectionClassName =
  "border-border/70 bg-surface-muted/45 space-y-5 rounded-lg border p-4 shadow-sm sm:p-5";
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
      className="space-y-5"
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
              <span className="text-sm font-semibold">
                صورة الطالب <span className="font-normal">(اختياري)</span>
              </span>
              <div className="border-border bg-surface flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-foreground/60 min-w-0 truncate text-sm">
                  {photoName}
                </span>
                <label className="btn-primary cursor-pointer px-3 py-2">
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

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب الطالب"}
      </button>

      <Link
        href="/login"
        className="text-primary-700 hover:text-primary-900 block text-center text-sm font-bold transition"
      >
        عندك حساب بالفعل؟ سجل دخول
      </Link>
    </form>
  );
}
