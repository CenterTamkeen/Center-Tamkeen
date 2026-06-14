"use client";

import Image from "next/image";
import { useActionState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { createCourseAction, updateCourseAction } from "@/lib/teacher/actions";
import type { Database } from "@/types/database";

import { ErrorText, FormFeedback } from "./form-feedback";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

type CourseFormProps = {
  course?: Pick<
    CourseRow,
    "id" | "title" | "description" | "price" | "thumbnail_url"
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
        <label className="space-y-2 sm:col-span-2">
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
          <ErrorText message={state.fieldErrors?.thumbnail?.[0]} />
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
