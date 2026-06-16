"use client";

import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  bulkDeleteLessonsAction,
  createLessonAction,
  deleteLessonAction,
  duplicateLessonAction,
  moveLessonAction,
  moveLessonToCourseAction,
  reorderLessonsAction,
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
  courses,
}: {
  courseId: string;
  lessons: TeacherLesson[];
  courses: { id: string; title: string }[];
}) {
  const [orderedLessonIds, setOrderedLessonIds] = useState(
    lessons.map((lesson) => lesson.id),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const orderedLessons = useMemo(() => {
    const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    return orderedLessonIds
      .map((lessonId) => lessonsById.get(lessonId))
      .filter(Boolean) as TeacherLesson[];
  }, [lessons, orderedLessonIds]);

  function moveDraggedLesson(sourceId: string, targetId: string) {
    setOrderedLessonIds((current) => {
      const sourceIndex = current.indexOf(sourceId);
      const targetIndex = current.indexOf(targetId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return current;
      }

      const next = [...current];
      const [removed] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <CreateLessonForm courseId={courseId} />

      {lessons.length > 0 ? (
        <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <p className="text-sm font-bold">
            {selectedIds.length.toLocaleString("ar-EG")} حصة محددة
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={bulkDeleteLessonsAction}>
              <input type="hidden" name="courseId" value={courseId} />
              <input
                type="hidden"
                name="lessonIds"
                value={selectedIds.join(",")}
              />
              <button
                disabled={selectedIds.length === 0}
                className="btn-secondary px-3 py-2 text-xs text-red-700 disabled:opacity-40"
              >
                حذف المحدد
              </button>
            </form>
            <form action={reorderLessonsAction}>
              <input type="hidden" name="courseId" value={courseId} />
              <input
                type="hidden"
                name="lessonIds"
                value={orderedLessonIds.join(",")}
              />
              <button className="btn-primary px-3 py-2 text-xs">
                حفظ الترتيب
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="glass-panel-strong overflow-hidden rounded-xl">
        {orderedLessons.length > 0 ? (
          orderedLessons.map((lesson, index) => (
            <article
              key={lesson.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", lesson.id);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                moveDraggedLesson(
                  event.dataTransfer.getData("text/plain"),
                  lesson.id,
                );
              }}
              className="space-y-4 border-b p-4 last:border-b-0"
              style={{ borderColor: "rgb(208 227 218 / 0.55)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lesson.id)}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, lesson.id]
                          : current.filter((item) => item !== lesson.id),
                      );
                    }}
                    className="accent-primary-600 h-4 w-4"
                  />
                  <span className="bg-primary-50 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black">
                    {(index + 1).toLocaleString("ar-EG")}
                  </span>
                  <p className="text-sm font-black">اسحب لإعادة الترتيب</p>
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
                  <form action={duplicateLessonAction}>
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button
                      type="submit"
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      نسخ
                    </button>
                  </form>
                </div>
              </div>
              <LessonEditForm lesson={lesson} courseId={courseId} />
              <form
                action={moveLessonToCourseAction}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <select
                  name="targetCourseId"
                  defaultValue=""
                  className="field bg-background/60 max-w-xs py-2 text-sm"
                >
                  <option value="" disabled>
                    نقل لكورس آخر
                  </option>
                  {courses
                    .filter((course) => course.id !== courseId)
                    .map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                </select>
                <button className="btn-secondary px-3 py-2 text-xs">
                  نقل الحصة
                </button>
              </form>
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
