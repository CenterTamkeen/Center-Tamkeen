"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
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
type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
type GradeKey = keyof typeof sectionsByGrade;

type ProfileFormProps = {
  profile: Pick<ProfileRow, "full_name" | "phone" | "role" | "avatar_url">;
  student?: Pick<
    StudentRow,
    | "student_phone"
    | "father_phone"
    | "school_name"
    | "gender"
    | "grade"
    | "section"
  > | null;
  teacher?: Pick<
    TeacherRow,
    "subject" | "bio" | "avatar_url" | "cover_url" | "slug"
  > | null;
};

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

export function ProfileForm({ profile, student, teacher }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  const [photoName, setPhotoName] = useState("");
  const [coverName, setCoverName] = useState("");
  const formValues = {
    fullName: state.values?.fullName ?? profile.full_name,
    phone: state.values?.phone ?? profile.phone ?? "",
    teacherSubject: state.values?.teacherSubject ?? teacher?.subject ?? "",
    teacherBio: state.values?.teacherBio ?? teacher?.bio ?? "",
    studentPhone: state.values?.studentPhone ?? student?.student_phone ?? "",
    fatherPhone: state.values?.fatherPhone ?? student?.father_phone ?? "",
    schoolName: state.values?.schoolName ?? student?.school_name ?? "",
    gender: state.values?.gender ?? student?.gender ?? "",
    grade: state.values?.grade ?? student?.grade ?? "",
    section: state.values?.section ?? student?.section ?? "",
  };
  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
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
  const isStudent = profile.role === "student";
  const isTeacher = profile.role === "teacher";
  const avatar = teacher?.avatar_url ?? profile.avatar_url;
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
        <div
          className={`animate-slide-down flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            state.status === "success" ? "text-primary-700" : "text-red-700"
          }`}
          style={{
            background:
              state.status === "success"
                ? "linear-gradient(135deg, rgb(231 245 241 / 0.8), rgb(197 232 223 / 0.5))"
                : "linear-gradient(135deg, rgb(254 226 226 / 0.8), rgb(254 202 202 / 0.5))",
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
            {state.status === "success" ? (
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
          {state.message}
        </div>
      ) : null}

      {isTeacher ? (
        <section className="overflow-hidden rounded-2xl border bg-white/70">
          <label className="group relative block h-48 cursor-pointer bg-[linear-gradient(135deg,var(--primary-700),var(--primary-400),var(--accent-300))] sm:h-64">
            <input
              name="cover"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) =>
                setCoverName(event.currentTarget.files?.[0]?.name ?? "")
              }
            />
            {teacher?.cover_url ? (
              <Image
                src={teacher.cover_url}
                alt="خلفية المدرس"
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-cover"
                priority
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            <span className="text-primary-700 absolute top-5 left-5 rounded-xl bg-white/90 px-4 py-2 text-xs font-black opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-300 group-hover:opacity-100">
              تغيير الخلفية
            </span>
            {coverName ? (
              <span className="absolute bottom-5 left-5 rounded-xl bg-black/65 px-4 py-2 text-xs font-black text-white">
                تم اختيار خلفية جديدة
              </span>
            ) : null}
          </label>
          <div className="relative px-5 pb-5">
            <div className="-mt-14 flex flex-wrap items-end gap-4">
              <label className="avatar-ring group relative h-28 w-28 cursor-pointer overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[var(--shadow-card)]">
                <input
                  name="photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    setPhotoName(event.currentTarget.files?.[0]?.name ?? "")
                  }
                />
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={profile.full_name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-primary-600 text-primary-foreground flex h-full items-center justify-center text-4xl font-black">
                    {profile.full_name.slice(0, 1)}
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1.5 text-center text-xs font-black text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  تغيير
                </span>
              </label>
              <div className="pb-2">
                <p className="eyebrow">{teacher?.subject ?? "مدرس تمكين"}</p>
                <h2 className="text-2xl font-black">{profile.full_name}</h2>
              </div>
            </div>
            {photoName ? (
              <p className="text-primary-700 mt-3 text-xs font-black">
                تم اختيار صورة شخصية جديدة
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/dashboard/teacher"
                className="btn-secondary px-3 py-2 text-xs"
              >
                الإحصائيات
              </Link>
              <Link
                href="/dashboard/teacher/courses"
                className="btn-secondary px-3 py-2 text-xs"
              >
                الكورسات
              </Link>
              <Link
                href="/dashboard/teacher/coupons"
                className="btn-secondary px-3 py-2 text-xs"
              >
                الكوبونات
              </Link>
              <Link
                href="/dashboard/teacher/students"
                className="btn-secondary px-3 py-2 text-xs"
              >
                الطلاب
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الاسم
          </span>
          <input
            {...register("fullName")}
            className="field bg-background/60 py-2.5"
          />
          <ErrorText
            message={
              errors.fullName?.message ?? state.fieldErrors?.fullName?.[0]
            }
          />
        </label>

        <label className="block space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            رقم الهاتف
          </span>
          <input
            {...register("phone")}
            inputMode="tel"
            className="field bg-background/60 py-2.5 text-right"
          />
          <ErrorText
            message={errors.phone?.message ?? state.fieldErrors?.phone?.[0]}
          />
        </label>

        {!isTeacher ? (
          <label className="block space-y-2">
            <span className="text-foreground/80 text-sm font-semibold">
              الصورة
            </span>
            <input
              {...register("photo")}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="bg-background/60 focus:border-primary-400 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-300 file:ml-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:font-bold focus:shadow-[0_0_0_4px_rgb(22_138_117/0.08)]"
              style={{ borderColor: "var(--border)" }}
            />
            <ErrorText message={state.fieldErrors?.photo?.[0]} />
          </label>
        ) : null}

        {isStudent ? (
          <>
            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                رقم الطالب
              </span>
              <input
                {...register("studentPhone")}
                inputMode="tel"
                className="field bg-background/60 py-2.5 text-right"
              />
              <ErrorText
                message={
                  errors.studentPhone?.message ??
                  state.fieldErrors?.studentPhone?.[0]
                }
              />
            </label>

            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                رقم ولي الأمر
              </span>
              <input
                {...register("fatherPhone")}
                inputMode="tel"
                className="field bg-background/60 py-2.5 text-right"
              />
              <ErrorText
                message={
                  errors.fatherPhone?.message ??
                  state.fieldErrors?.fatherPhone?.[0]
                }
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-foreground/80 text-sm font-semibold">
                اسم المدرسة
              </span>
              <input
                {...register("schoolName")}
                className="field bg-background/60 py-2.5"
              />
              <ErrorText
                message={
                  errors.schoolName?.message ??
                  state.fieldErrors?.schoolName?.[0]
                }
              />
            </label>

            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                النوع
              </span>
              <select
                {...register("gender")}
                className="field bg-background/60 py-2.5"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              <ErrorText
                message={
                  errors.gender?.message ?? state.fieldErrors?.gender?.[0]
                }
              />
            </label>

            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                السنة الدراسية
              </span>
              <select
                {...register("grade")}
                className="field bg-background/60 py-2.5"
              >
                {Object.entries(gradeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ErrorText
                message={errors.grade?.message ?? state.fieldErrors?.grade?.[0]}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                الشعبة
              </span>
              <select
                {...register("section")}
                className="field bg-background/60 py-2.5"
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

        {isTeacher ? (
          <>
            <label className="block space-y-2">
              <span className="text-foreground/80 text-sm font-semibold">
                المادة
              </span>
              <input
                {...register("teacherSubject")}
                className="field bg-background/60 py-2.5"
              />
              <ErrorText
                message={
                  errors.teacherSubject?.message ??
                  state.fieldErrors?.teacherSubject?.[0]
                }
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-foreground/80 text-sm font-semibold">
                نبذة المدرس
              </span>
              <textarea
                {...register("teacherBio")}
                rows={5}
                className="field bg-background/60 resize-none py-2.5 leading-7"
              />
              <ErrorText
                message={
                  errors.teacherBio?.message ??
                  state.fieldErrors?.teacherBio?.[0]
                }
              />
            </label>
          </>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary gap-2 px-6 py-2.5"
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
            جاري الحفظ...
          </>
        ) : (
          "حفظ التغييرات"
        )}
      </button>
    </form>
  );
}
