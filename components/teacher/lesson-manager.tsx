"use client";

import { useActionState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  createLessonAction,
  deleteLessonAction,
  moveLessonAction,
  updateLessonAction,
} from "@/lib/teacher/actions";
import type { TeacherLesson } from "@/lib/teacher/data";

import { ErrorText, FormFeedback } from "./form-feedback";

function minutesFromSeconds(seconds: number | null) {
  return seconds ? Math.round(seconds / 60) : "";
}

function CreateLessonForm({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState(
    createLessonAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="card-modern space-y-4 p-5">
      <input type="hidden" name="courseId" value={courseId} />
      <FormFeedback state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 sm:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            عنوان الحصة
          </span>
          <input
            name="title"
            defaultValue={state.values?.title ?? ""}
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.title?.[0]} />
        </label>
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            VdoCipher Video ID
          </span>
          <input
            name="vdocipherVideoId"
            defaultValue={state.values?.vdocipherVideoId ?? ""}
            className="field bg-background/60 py-2.5 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.vdocipherVideoId?.[0]} />
        </label>
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            المدة بالدقائق
          </span>
          <input
            name="durationMinutes"
            type="number"
            min="0"
            step="1"
            defaultValue={state.values?.durationMinutes ?? ""}
            className="field bg-background/60 py-2.5 text-right"
          />
          <ErrorText message={state.fieldErrors?.durationMinutes?.[0]} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          name="isFreePreview"
          type="checkbox"
          className="accent-primary-600 h-4 w-4"
        />
        حصة Preview مجانية
      </label>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "جاري الإضافة..." : "إضافة حصة"}
      </button>
    </form>
  );
}

function LessonEditForm({
  lesson,
  courseId,
}: {
  lesson: TeacherLesson;
  courseId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateLessonAction,
    initialActionState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 lg:grid-cols-[1fr_170px_120px_auto]"
    >
      <input type="hidden" name="lessonId" value={lesson.id} />
      <input type="hidden" name="courseId" value={courseId} />
      <div className="space-y-2">
        <input
          name="title"
          defaultValue={state.values?.title ?? lesson.title}
          className="field bg-background/60 py-2.5"
        />
        <ErrorText message={state.fieldErrors?.title?.[0]} />
      </div>
      <input
        name="vdocipherVideoId"
        defaultValue={
          state.values?.vdocipherVideoId ?? lesson.vdocipher_video_id ?? ""
        }
        className="field bg-background/60 py-2.5 text-left"
        dir="ltr"
        placeholder="Video ID"
      />
      <input
        name="durationMinutes"
        type="number"
        min="0"
        step="1"
        defaultValue={
          state.values?.durationMinutes ?? minutesFromSeconds(lesson.duration)
        }
        className="field bg-background/60 py-2.5 text-right"
        placeholder="الدقائق"
      />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            name="isFreePreview"
            type="checkbox"
            defaultChecked={lesson.is_free_preview}
            className="accent-primary-600 h-4 w-4"
          />
          Preview
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="btn-secondary px-3 py-2 text-xs"
        >
          حفظ
        </button>
      </div>
      <div className="lg:col-span-4">
        <FormFeedback state={state} />
      </div>
    </form>
  );
}

export function LessonManager({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: TeacherLesson[];
}) {
  return (
    <div className="space-y-5">
      <CreateLessonForm courseId={courseId} />

      <div className="glass-panel-strong overflow-hidden rounded-xl">
        {lessons.length > 0 ? (
          lessons.map((lesson, index) => (
            <article
              key={lesson.id}
              className="space-y-4 border-b p-4 last:border-b-0"
              style={{ borderColor: "rgb(208 227 218 / 0.55)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-primary-50 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black">
                    {(index + 1).toLocaleString("ar-EG")}
                  </span>
                  <p className="text-sm font-black">ترتيب الحصة</p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={moveLessonAction}>
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                    >
                      أعلى
                    </button>
                  </form>
                  <form action={moveLessonAction}>
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === lessons.length - 1}
                      className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                    >
                      أسفل
                    </button>
                  </form>
                  <form action={deleteLessonAction}>
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button
                      type="submit"
                      className="btn-secondary px-3 py-2 text-xs text-red-700"
                    >
                      حذف
                    </button>
                  </form>
                </div>
              </div>
              <LessonEditForm lesson={lesson} courseId={courseId} />
            </article>
          ))
        ) : (
          <p className="text-foreground/60 px-5 py-10 text-center">
            لا توجد حصص لهذا الكورس حتى الآن.
          </p>
        )}
      </div>
    </div>
  );
}
