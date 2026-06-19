"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { startTransition, useActionState, useMemo, useState } from "react";
import * as tus from "tus-js-client";

import { initialActionState } from "@/lib/auth/action-state";
import {
  bulkDeleteLessonsAction,
  createLessonAction,
  deleteLessonAction,
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

type TusCredentials = {
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
};

function getSelectedFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (
    value &&
    typeof value === "object" &&
    "size" in value &&
    typeof value.size === "number" &&
    value.size > 0
  ) {
    return value as File;
  }

  return null;
}

async function uploadVideoDirectlyToBunny({
  courseId,
  title,
  file,
  onProgress,
}: {
  courseId: string;
  title: string;
  file: File;
  onProgress: (progress: number) => void;
}) {
  const response = await fetch("/api/bunny/tus-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ courseId, title }),
  });

  if (!response.ok) {
    throw new Error("تعذر تجهيز رفع الفيديو.");
  }

  const credentials = (await response.json()) as TusCredentials;

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      removeFingerprintOnSuccess: true,
      headers: {
        AuthorizationSignature: credentials.signature,
        AuthorizationExpire: String(credentials.expirationTime),
        VideoId: credentials.videoId,
        LibraryId: credentials.libraryId,
      },
      metadata: {
        filetype: file.type || "video/mp4",
        title,
      },
      onProgress(bytesUploaded, bytesTotal) {
        onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        resolve();
      },
    });

    upload.start();
  });

  const hasUploadedBytes = await waitForBunnyUploadedBytes(credentials.videoId);

  if (!hasUploadedBytes) {
    throw new Error("Bunny did not receive the uploaded video bytes.");
  }

  return credentials.videoId;
}

async function waitForBunnyUploadedBytes(videoId: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetch(
      `/api/bunny/video-status?videoId=${encodeURIComponent(videoId)}`,
    );

    if (response.ok) {
      const status = (await response.json()) as { storageSize?: number | null };

      if (typeof status.storageSize === "number" && status.storageSize > 0) {
        return true;
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }

  return false;
}

function CreateLessonForm({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState(
    createLessonAction,
    initialActionState,
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const videoFile = getSelectedFile(formData, "videoFile");

    if (videoFile) {
      try {
        setUploadProgress(0);
        const videoId = await uploadVideoDirectlyToBunny({
          courseId,
          title: String(formData.get("title") ?? "حصة جديدة"),
          file: videoFile,
          onProgress: setUploadProgress,
        });
        formData.set("bunnyVideoId", videoId);
      } catch {
        setUploadError("تعذر رفع الفيديو. تأكد من الاتصال وحاول مرة تانية.");
        setUploadProgress(null);
        return;
      }
    }

    if (!formData.get("bunnyVideoId")) {
      setUploadError("اختار فيديو الحصة قبل الإضافة.");
      setUploadProgress(null);
      return;
    }

    formData.delete("videoFile");
    setUploadProgress(null);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-modern space-y-4 p-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="bunnyVideoId" value="" />
      <FormFeedback state={state} />
      {uploadError ? <ErrorText message={uploadError} /> : null}
      {uploadProgress !== null ? (
        <p className="text-primary-700 text-sm font-bold">
          جاري رفع الفيديو: {uploadProgress.toLocaleString("ar-EG")}%
        </p>
      ) : null}
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
        <label className="space-y-2 sm:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الصورة المصغرة للحصة
          </span>
          <input
            name="thumbnail"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field bg-background/60 py-2.5"
          />
          <p className="text-foreground/50 text-xs leading-5 font-semibold">
            المقاس المقترح للمصمم: 1280 × 720 بكسل بنسبة 16:9. JPG/PNG/WebP بحد
            أقصى 3MB.
          </p>
          <ErrorText message={state.fieldErrors?.thumbnail?.[0]} />
        </label>
        <label className="space-y-2 sm:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            فيديو الحصة
          </span>
          <input
            name="videoFile"
            type="file"
            accept="video/*"
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.videoFile?.[0]} />
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
      <button
        type="submit"
        disabled={isPending || uploadProgress !== null}
        className="btn-primary"
      >
        {uploadProgress !== null
          ? `جاري رفع الفيديو ${uploadProgress.toLocaleString("ar-EG")}%`
          : isPending
            ? "جاري الإضافة..."
            : "إضافة حصة"}
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError("");

    const formData = new FormData(event.currentTarget);
    const videoFile = getSelectedFile(formData, "videoFile");

    if (videoFile) {
      try {
        setUploadProgress(0);
        const videoId = await uploadVideoDirectlyToBunny({
          courseId,
          title: String(formData.get("title") ?? lesson.title),
          file: videoFile,
          onProgress: setUploadProgress,
        });
        formData.set("bunnyVideoId", videoId);
      } catch {
        setUploadError("تعذر رفع الفيديو. تأكد من الاتصال وحاول مرة تانية.");
        setUploadProgress(null);
        return;
      }
    }

    formData.delete("videoFile");
    setUploadProgress(null);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 lg:grid-cols-[1fr_180px_180px_120px_auto]"
    >
      <input type="hidden" name="lessonId" value={lesson.id} />
      <input type="hidden" name="courseId" value={courseId} />
      <input
        type="hidden"
        name="bunnyVideoId"
        value={lesson.bunny_video_id ?? lesson.vdocipher_video_id ?? ""}
      />
      <div className="space-y-2">
        <input
          name="title"
          defaultValue={state.values?.title ?? lesson.title}
          className="field bg-background/60 py-2.5"
        />
        <ErrorText message={state.fieldErrors?.title?.[0]} />
      </div>
      <div className="space-y-1.5">
        <input
          name="thumbnail"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field bg-background/60 py-2.5 text-xs"
          aria-label="الصورة المصغرة للحصة"
        />
        <p className="text-foreground/50 text-[11px] leading-4 font-semibold">
          1280 × 720 بكسل
        </p>
      </div>
      <input
        name="videoFile"
        type="file"
        accept="video/*"
        className="field bg-background/60 py-2.5 text-xs"
        aria-label="فيديو الحصة"
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
          disabled={isPending || uploadProgress !== null}
          className="btn-secondary px-3 py-2 text-xs"
        >
          حفظ
        </button>
      </div>
      <div className="lg:col-span-5">
        {uploadError ? <ErrorText message={uploadError} /> : null}
        {uploadProgress !== null ? (
          <p className="text-primary-700 mb-2 text-sm font-bold">
            جاري رفع الفيديو: {uploadProgress.toLocaleString("ar-EG")}%
          </p>
        ) : null}
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
                  {lesson.thumbnail_url ? (
                    <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={lesson.thumbnail_url}
                        alt={lesson.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
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
