"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { updateProfileAction } from "@/lib/auth/actions";
import {
  gradeLabels,
  profileUpdateSchema,
  sectionLabels,
  sectionsByGrade,
} from "@/lib/validations/auth";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
type GradeKey = keyof typeof sectionsByGrade;

type ProfileFormProps = {
  profile: Pick<ProfileRow, "full_name" | "phone" | "role">;
  student?: Pick<
    StudentRow,
    | "student_phone"
    | "father_phone"
    | "school_name"
    | "gender"
    | "grade"
    | "section"
  > | null;
};

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-danger text-sm">{message}</p>;
}

export function ProfileForm({ profile, student }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: profile.full_name,
      phone: profile.phone ?? "",
      studentPhone: student?.student_phone ?? "",
      fatherPhone: student?.father_phone ?? "",
      schoolName: student?.school_name ?? "",
      gender: student?.gender ?? "",
      grade: student?.grade ?? "",
      section: student?.section ?? "",
    },
  });
  const selectedGrade = useWatch({
    control,
    name: "grade",
  }) as GradeKey | "";
  const selectedSection = useWatch({
    control,
    name: "section",
  });
  const isStudent = profile.role === "student";
  const availableSections = useMemo(() => {
    if (!selectedGrade) {
      return [];
    }

    return sectionsByGrade[selectedGrade] ?? [];
  }, [selectedGrade]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }

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
  }, [isStudent, selectedGrade, selectedSection, setValue]);

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-semibold">الاسم</span>
          <input
            {...register("fullName")}
            className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 outline-none focus:ring-4"
          />
          <ErrorText
            message={
              errors.fullName?.message ?? state.fieldErrors?.fullName?.[0]
            }
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">رقم الهاتف</span>
          <input
            {...register("phone")}
            inputMode="tel"
            className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 text-right outline-none focus:ring-4"
          />
          <ErrorText
            message={errors.phone?.message ?? state.fieldErrors?.phone?.[0]}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">الصورة</span>
          <input
            {...register("photo")}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="border-border bg-surface file:bg-primary file:text-primary-foreground w-full rounded-md border px-3 py-2 text-sm file:ml-3 file:rounded-sm file:border-0 file:px-3 file:py-1.5 file:font-semibold"
          />
          <ErrorText message={state.fieldErrors?.photo?.[0]} />
        </label>

        {isStudent ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">رقم الطالب</span>
              <input
                {...register("studentPhone")}
                inputMode="tel"
                className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 text-right outline-none focus:ring-4"
              />
              <ErrorText
                message={
                  errors.studentPhone?.message ??
                  state.fieldErrors?.studentPhone?.[0]
                }
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">رقم ولي الأمر</span>
              <input
                {...register("fatherPhone")}
                inputMode="tel"
                className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 text-right outline-none focus:ring-4"
              />
              <ErrorText
                message={
                  errors.fatherPhone?.message ??
                  state.fieldErrors?.fatherPhone?.[0]
                }
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">اسم المدرسة</span>
              <input
                {...register("schoolName")}
                className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 outline-none focus:ring-4"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">النوع</span>
              <select
                {...register("gender")}
                className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 outline-none focus:ring-4"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">السنة الدراسية</span>
              <select
                {...register("grade")}
                className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 outline-none focus:ring-4"
              >
                {Object.entries(gradeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">الشعبة</span>
              <select
                {...register("section")}
                className="border-border bg-surface focus:ring-primary/25 w-full rounded-md border px-3 py-2 outline-none focus:ring-4"
              >
                {availableSections.map((value) => (
                  <option key={value} value={value}>
                    {sectionLabels[value]}
                  </option>
                ))}
              </select>
              <ErrorText
                message={
                  errors.section?.message ?? state.fieldErrors?.section?.[0]
                }
              />
            </label>
          </>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary-600 rounded-md px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  );
}
