"use client";

import Image from "next/image";
import { useActionState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { createCourseAction, updateCourseAction } from "@/lib/teacher/actions";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";
import type { Database } from "@/types/database";

import { ErrorText, FormFeedback } from "./form-feedback";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

type CourseFormProps = {
  course?: Pick<
    CourseRow,
    | "id"
    | "subject"
    | "title"
    | "description"
    | "price"
    | "target_grade"
    | "target_section"
    | "thumbnail_url"
  > | null;
};

export function CourseForm({ course }: CourseFormProps) {
  const action = course ? updateCourseAction : createCourseAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormFeedback state={state} />
      {course ? (
        <input type="hidden" name="courseId" value={course.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            المادة
          </span>
          <input
            name="subject"
            defaultValue={state.values?.subject ?? course?.subject ?? ""}
            className="field bg-background/60 py-2.5"
            placeholder="مثال: تاريخ وجغرافيا"
          />
          <p className="text-foreground/50 text-xs leading-5 font-semibold">
            المادة دي هتظهر فوق كارد الكورس وفي الفلاتر.
          </p>
          <ErrorText message={state.fieldErrors?.subject?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            عنوان الكورس
          </span>
          <input
            name="title"
            defaultValue={state.values?.title ?? course?.title ?? ""}
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.title?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            السعر بالجنيه
          </span>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={state.values?.price ?? course?.price ?? ""}
            className="field bg-background/60 py-2.5 text-right"
          />
          <ErrorText message={state.fieldErrors?.price?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الصورة المصغّرة
          </span>
          <input
            name="thumbnail"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="bg-background/60 focus:border-primary-400 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-300 file:ml-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:font-bold focus:shadow-[0_0_0_4px_rgb(22_138_117/0.08)]"
          />
          <p className="text-foreground/50 text-xs leading-5 font-semibold">
            المقاس المقترح للمصمم: 1280 × 720 بكسل بنسبة 16:9. JPG/PNG/WebP بحد
            أقصى 3MB.
          </p>
          <ErrorText message={state.fieldErrors?.thumbnail?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الصف الدراسي
          </span>
          <select
            name="targetGrade"
            defaultValue={
              state.values?.targetGrade ?? course?.target_grade ?? ""
            }
            className="field bg-background/60 py-2.5"
          >
            <option value="">كل الصفوف</option>
            {Object.entries(gradeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ErrorText message={state.fieldErrors?.targetGrade?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            المسار
          </span>
          <select
            name="targetSection"
            defaultValue={
              state.values?.targetSection ?? course?.target_section ?? ""
            }
            className="field bg-background/60 py-2.5"
          >
            <option value="">كل المسارات</option>
            {Object.entries(sectionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ErrorText message={state.fieldErrors?.targetSection?.[0]} />
        </label>

        {course?.thumbnail_url ? (
          <div className="relative aspect-video overflow-hidden rounded-xl sm:col-span-2">
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        ) : null}

        <label className="space-y-2 sm:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            وصف الكورس
          </span>
          <textarea
            name="description"
            rows={5}
            defaultValue={
              state.values?.description ?? course?.description ?? ""
            }
            className="field bg-background/60 resize-none py-2.5 leading-7"
          />
          <ErrorText message={state.fieldErrors?.description?.[0]} />
        </label>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending
          ? "جاري الحفظ..."
          : course
            ? "حفظ التعديلات"
            : "إنشاء الكورس"}
      </button>
    </form>
  );
}
