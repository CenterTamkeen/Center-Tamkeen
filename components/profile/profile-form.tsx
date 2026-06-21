"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { initialActionState } from "@/lib/auth/action-state";
import { changePasswordAction, updateProfileAction } from "@/lib/auth/actions";
import {
  PasswordInput,
  PasswordStrength,
} from "@/components/auth/password-tools";
import {
  changePasswordSchema,
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
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
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
    | "photo_url"
  > | null;
  teacher?: Pick<
    TeacherRow,
    "subject" | "bio" | "avatar_url" | "cover_url" | "slug"
  > | null;
  email?: string;
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

export function ProfileForm({
  profile,
  student,
  teacher,
  email,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    changePasswordAction,
    initialActionState,
  );
  const [photoName, setPhotoName] = useState("");
  const [coverName, setCoverName] = useState("");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const studentPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const teacherCoverInputRef = useRef<HTMLInputElement | null>(null);
  const isStudent = profile.role === "student";
  const isTeacher = profile.role === "teacher";
  const stateValueOrFallback = (
    key: keyof NonNullable<typeof state.values>,
    fallback: string | null | undefined,
  ) => {
    const value = state.values?.[key];

    return value && value.trim().length > 0 ? value : (fallback ?? "");
  };
  const formValues = {
    fullName: isTeacher
      ? stateValueOrFallback("fullName", profile.full_name)
      : (state.values?.fullName ?? profile.full_name),
    phone: isTeacher
      ? stateValueOrFallback("phone", profile.phone)
      : (state.values?.phone ?? profile.phone ?? ""),
    teacherSubject: isTeacher
      ? stateValueOrFallback("teacherSubject", teacher?.subject)
      : (state.values?.teacherSubject ?? teacher?.subject ?? ""),
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
  const {
    register: registerPassword,
    control: passwordControl,
    trigger: triggerPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    values: {
      currentPassword: passwordState.values?.currentPassword ?? "",
      newPassword: passwordState.values?.newPassword ?? "",
      confirmNewPassword: passwordState.values?.confirmNewPassword ?? "",
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
  const photoField = register("photo");
  const avatar =
    teacher?.avatar_url ?? student?.photo_url ?? profile.avatar_url;
  const photoPreview = previewPhotoUrl ?? avatar;
  const coverPreview = isCoverRemoved
    ? null
    : (previewCoverUrl ?? teacher?.cover_url);
  const canPreviewPhoto = Boolean(photoPreview);
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

  useEffect(() => {
    return () => {
      if (previewPhotoUrl) {
        URL.revokeObjectURL(previewPhotoUrl);
      }
      if (previewCoverUrl) {
        URL.revokeObjectURL(previewCoverUrl);
      }
    };
  }, [previewCoverUrl, previewPhotoUrl]);

  useEffect(() => {
    if (passwordState.status === "success") {
      resetPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [passwordState.status, resetPasswordForm]);

  const updatePhotoPreview = (file?: File) => {
    setPhotoName(file?.name ?? "");
    setPreviewPhotoUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return file ? URL.createObjectURL(file) : null;
    });
  };

  const updateCoverPreview = (file?: File) => {
    setCoverName(file?.name ?? "");
    setIsCoverRemoved(false);
    setPreviewCoverUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return file ? URL.createObjectURL(file) : null;
    });
  };

  const removeCoverPreview = () => {
    setCoverName("");
    setIsCoverRemoved(true);
    if (teacherCoverInputRef.current) {
      teacherCoverInputRef.current.value = "";
    }
    setPreviewCoverUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
  };

  return (
    <>
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

        {isStudent ? (
          <section className="flex flex-col items-center gap-3">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-[var(--shadow-card)]">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt={profile.full_name}
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized={Boolean(previewPhotoUrl)}
                />
              ) : (
                <div className="bg-primary-600 text-primary-foreground flex h-full items-center justify-center text-4xl font-black">
                  {profile.full_name.slice(0, 1)}
                </div>
              )}
              {canPreviewPhoto ? (
                <button
                  type="button"
                  aria-label="معاينة الصورة"
                  className="absolute top-1.5 left-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                  onClick={() => setIsPhotoViewerOpen(true)}
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
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              ) : null}
            </div>
            <input
              name={photoField.name}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              ref={(element) => {
                photoField.ref(element);
                studentPhotoInputRef.current = element;
              }}
              onBlur={photoField.onBlur}
              onChange={(event) => {
                photoField.onChange(event);
                updatePhotoPreview(event.currentTarget.files?.[0]);
              }}
            />
            <button
              type="button"
              className="btn-secondary px-4 py-2 text-sm"
              onClick={() => studentPhotoInputRef.current?.click()}
            >
              تغيير الصورة
            </button>
            <p className="text-foreground/50 max-w-xs text-center text-xs leading-5 font-semibold">
              المقاس المقترح للصورة الشخصية: 800 × 800 بكسل بنسبة 1:1.
              JPG/PNG/WebP بحد أقصى 2MB.
            </p>
            <ErrorText message={state.fieldErrors?.photo?.[0]} />
          </section>
        ) : null}
        {isTeacher ? (
          <section className="overflow-hidden rounded-2xl border bg-white/70">
            <label className="group relative block h-48 cursor-pointer bg-[linear-gradient(135deg,var(--primary-700),var(--primary-400),var(--accent-300))] sm:h-64">
              <input
                type="hidden"
                name="removeCover"
                value={isCoverRemoved ? "1" : "0"}
              />
              <input
                ref={teacherCoverInputRef}
                name="cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) =>
                  updateCoverPreview(event.currentTarget.files?.[0])
                }
              />
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="خلفية المدرس"
                  fill
                  sizes="(max-width: 768px) 100vw, 900px"
                  className="object-cover"
                  unoptimized={Boolean(previewCoverUrl)}
                  priority
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <span className="text-primary-700 absolute top-5 left-5 rounded-xl bg-white/90 px-4 py-2 text-xs font-black opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-300 group-hover:opacity-100">
                تغيير الخلفية
              </span>
              {coverPreview ? (
                <button
                  type="button"
                  aria-label="حذف الخلفية"
                  title="حذف الخلفية"
                  className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 shadow-[var(--shadow-card)] transition-all duration-300 hover:bg-red-700 focus-visible:opacity-100 focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:outline-none group-hover:opacity-100"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removeCoverPreview();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </button>
              ) : null}
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
                      updatePhotoPreview(event.currentTarget.files?.[0])
                    }
                  />
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt={profile.full_name}
                      fill
                      sizes="112px"
                      className="object-cover"
                      unoptimized={Boolean(previewPhotoUrl)}
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
                <div className="translate-y-3 pb-1 sm:translate-y-4">
                  <p className="eyebrow">{teacher?.subject ?? "مدرس تمكين"}</p>
                  <h2 className="text-2xl font-black">{profile.full_name}</h2>
                </div>
              </div>
              {photoName ? (
                <p className="text-primary-700 mt-3 text-xs font-black">
                  تم اختيار صورة شخصية جديدة
                </p>
              ) : null}
              <p className="text-foreground/55 mt-4 text-xs leading-5 font-semibold">
                مقاس بانر صفحة المدرس المقترح: 1600 × 600 بكسل بنسبة 8:3. اترك
                التفاصيل المهمة في منتصف التصميم. JPG/PNG/WebP بحد أقصى 2MB.
              </p>
              <ErrorText message={state.fieldErrors?.cover?.[0]} />
              <p className="text-foreground/55 mt-3 text-xs leading-5 font-semibold">
                مقاس صورة المدرس المقترح: 800 × 800 بكسل بنسبة 1:1. JPG/PNG/WebP
                بحد أقصى 2MB.
              </p>
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
                  href="/dashboard/teacher/announcements"
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  الإعلانات
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
                  message={
                    errors.grade?.message ?? state.fieldErrors?.grade?.[0]
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-foreground/80 text-sm font-semibold">
                  المسار
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
                <p className="text-foreground/50 text-xs leading-5 font-semibold">
                  المادة دي هتظهر فوق كروت كورساتك وفي صفحة المدرس.
                </p>
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

        {isStudent && isPhotoViewerOpen && photoPreview ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <button
              type="button"
              aria-label="إغلاق المعاينة"
              className="absolute inset-0 cursor-default"
              onClick={() => setIsPhotoViewerOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md">
              <button
                type="button"
                aria-label="إغلاق"
                className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                onClick={() => setIsPhotoViewerOpen(false)}
              >
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]">
                <Image
                  src={photoPreview}
                  alt={profile.full_name}
                  fill
                  sizes="(max-width: 768px) 90vw, 480px"
                  className="object-cover"
                  unoptimized={Boolean(previewPhotoUrl)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </form>
      <form
        action={passwordFormAction}
        className="mt-6 space-y-5 border-t pt-6"
        style={{ borderColor: "rgb(208 227 218 / 0.6)" }}
        onSubmit={async (event) => {
          const valid = await triggerPassword();

          if (!valid) {
            event.preventDefault();
          }
        }}
      >
        <div>
          <p className="eyebrow">الأمان</p>
          <h2 className="mt-1 text-xl font-black">تغيير كلمة المرور</h2>
        </div>

        {passwordState.message ? (
          <div
            className={`animate-slide-down flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
              passwordState.status === "success"
                ? "text-primary-700"
                : "text-red-700"
            }`}
            style={{
              background:
                passwordState.status === "success"
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
              {passwordState.status === "success" ? (
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
            {passwordState.message}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-foreground/80 text-sm font-semibold">
              كلمة المرور الحالية
            </span>
            <PasswordInput<ChangePasswordValues>
              name="currentPassword"
              register={registerPassword}
              autoComplete="current-password"
              className="field bg-background/60 py-2.5"
            />
            <ErrorText
              message={
                passwordErrors.currentPassword?.message ??
                passwordState.fieldErrors?.currentPassword?.[0]
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-foreground/80 text-sm font-semibold">
              كلمة المرور الجديدة
            </span>
            <PasswordInput<ChangePasswordValues>
              name="newPassword"
              register={registerPassword}
              autoComplete="new-password"
              className="field bg-background/60 py-2.5"
            />
            <PasswordStrength<ChangePasswordValues>
              control={passwordControl}
              name="newPassword"
            />
            <ErrorText
              message={
                passwordErrors.newPassword?.message ??
                passwordState.fieldErrors?.newPassword?.[0]
              }
            />
          </label>

          <label className="block space-y-2">
            <span className="text-foreground/80 text-sm font-semibold">
              تأكيد كلمة المرور الجديدة
            </span>
            <PasswordInput<ChangePasswordValues>
              name="confirmNewPassword"
              register={registerPassword}
              autoComplete="new-password"
              className="field bg-background/60 py-2.5"
            />
            <ErrorText
              message={
                passwordErrors.confirmNewPassword?.message ??
                passwordState.fieldErrors?.confirmNewPassword?.[0]
              }
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPasswordPending}
            className="btn-primary gap-2 px-6 py-2.5"
          >
            {isPasswordPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
          <Link
            href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="btn-secondary px-4 py-2.5 text-sm"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>
      </form>
    </>
  );
}
