"use client";

import Image from "next/image";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { startTransition, useActionState, useMemo, useState } from "react";
import * as tus from "tus-js-client";

import { initialActionState } from "@/lib/auth/action-state";
import {
  bulkDeleteLessonsAction,
  createLessonAction,
  createLessonFolderAction,
  deleteLessonFolderAction,
  deleteLessonAttachmentAction,
  deleteLessonAction,
  moveLessonToCourseAction,
  reorderLessonsAction,
  updateLessonFolderAction,
  updateLessonAction,
} from "@/lib/teacher/actions";
import type { TeacherLesson, TeacherLessonFolder } from "@/lib/teacher/data";

import { ErrorText, FormFeedback } from "./form-feedback";

function minutesFromSeconds(seconds: number | null) {
  return seconds ? Math.round(seconds / 60) : "";
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ar-EG")} KB`;
  }

  return `${(bytes / 1024 / 1024).toLocaleString("ar-EG", {
    maximumFractionDigits: 1,
  })} MB`;
}

function getQuizOptions(value: unknown) {
  return Array.isArray(value)
    ? value.map((option) => String(option)).slice(0, 4)
    : [];
}

function LessonQuizFields({
  initialQuestions = [],
}: {
  initialQuestions?: TeacherLesson["lesson_quiz_questions"];
}) {
  const [questionCount, setQuestionCount] = useState(initialQuestions.length);

  return (
    <div className="border-primary-200 bg-primary-50/25 space-y-3 rounded-xl border border-dashed p-4">
      <input type="hidden" name="quizQuestionCount" value={questionCount} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">كويز MCQ اختياري</p>
          <p className="text-foreground/55 mt-1 text-xs font-bold">
            سيظهر للطالب بعد إكمال الحصة.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setQuestionCount((count) => count + 1)}
            className="btn-secondary px-3 py-2 text-xs"
          >
            إضافة سؤال
          </button>
          <button
            type="button"
            onClick={() => setQuestionCount((count) => Math.max(0, count - 1))}
            disabled={questionCount === 0}
            className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
          >
            حذف آخر سؤال
          </button>
        </div>
      </div>

      {Array.from({ length: questionCount }, (_, index) => {
        const question = initialQuestions[index];
        const options = getQuizOptions(question?.options);

        return (
          <div key={index} className="space-y-3 rounded-xl bg-white/55 p-3">
            <label className="space-y-2">
              <span className="text-foreground/80 text-xs font-black">
                السؤال {(index + 1).toLocaleString("ar-EG")}
              </span>
              <input
                name={`quizQuestion-${index}`}
                defaultValue={question?.question ?? ""}
                className="field bg-background/70 py-2.5"
                placeholder="اكتب السؤال"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((optionIndex) => (
                <label key={optionIndex} className="space-y-2">
                  <span className="text-foreground/70 text-xs font-bold">
                    اختيار {(optionIndex + 1).toLocaleString("ar-EG")}
                  </span>
                  <input
                    name={`quizOption-${index}-${optionIndex}`}
                    defaultValue={options[optionIndex] ?? ""}
                    className="field bg-background/70 py-2.5"
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold">
              {[0, 1, 2, 3].map((optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`quizCorrectOption-${index}`}
                    value={optionIndex}
                    defaultChecked={
                      question?.correct_option_index === optionIndex
                    }
                    className="accent-primary-600 h-4 w-4"
                  />
                  الإجابة {optionIndex + 1}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type TusCredentials = {
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
};

const BUNNY_UPLOAD_CHUNK_SIZE = 50 * 1024 * 1024;

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
      chunkSize: BUNNY_UPLOAD_CHUNK_SIZE,
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

function CreateLessonForm({
  courseId,
  folders,
}: {
  courseId: string;
  folders: TeacherLessonFolder[];
}) {
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
    const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();

    if (videoFile && youtubeUrl) {
      setUploadError("اختار رفع فيديو أو رابط YouTube فقط.");
      return;
    }

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
        formData.set("youtubeUrl", "");
      } catch {
        setUploadError("تعذر رفع الفيديو. تأكد من الاتصال وحاول مرة تانية.");
        setUploadProgress(null);
        return;
      }
    }

    if (!formData.get("bunnyVideoId") && !youtubeUrl) {
      setUploadError("اختار فيديو الحصة أو ادخل رابط YouTube قبل الإضافة.");
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
            فولدر الحصة (اختياري)
          </span>
          <select
            name="folderId"
            defaultValue={state.values?.folderId ?? ""}
            className="field bg-background/60 py-2.5"
          >
            <option value="">بدون فولدر</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <p className="text-foreground/50 text-xs font-bold">
            تقدر تعمل فولدر من بطاقة تنظيم الحصص أسفل النموذج.
          </p>
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
        <label className="space-y-2 sm:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            ادخل URL اليوتيوب
          </span>
          <input
            name="youtubeUrl"
            type="url"
            dir="ltr"
            defaultValue={state.values?.youtubeUrl ?? ""}
            className="field bg-background/60 py-2.5 text-left"
            placeholder="https://youtu.be/..."
          />
          <p className="text-foreground/50 text-xs font-bold">
            استخدم رفع الفيديو أو رابط YouTube، مش الاتنين مع بعض.
          </p>
          <ErrorText message={state.fieldErrors?.youtubeUrl?.[0]} />
        </label>
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            عنوان المرفق (اختياري)
          </span>
          <input
            name="attachmentTitle"
            defaultValue={state.values?.attachmentTitle ?? ""}
            className="field bg-background/60 py-2.5"
            placeholder="مثال: ملزمة الحصة PDF"
          />
          <ErrorText message={state.fieldErrors?.attachmentTitle?.[0]} />
        </label>
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            مرفق الحصة (اختياري)
          </span>
          <input
            name="attachmentFile"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,application/pdf"
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.attachmentFile?.[0]} />
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
      <LessonQuizFields />
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
  folders,
}: {
  lesson: TeacherLesson;
  courseId: string;
  folders: TeacherLessonFolder[];
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
    const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();

    if (videoFile && youtubeUrl) {
      setUploadError("اختار رفع فيديو أو رابط YouTube فقط.");
      return;
    }

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
        formData.set("youtubeUrl", "");
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
      className="grid gap-3 lg:grid-cols-[1fr_180px_120px_auto]"
    >
      <input type="hidden" name="lessonId" value={lesson.id} />
      <input type="hidden" name="courseId" value={courseId} />
      <input
        type="hidden"
        name="bunnyVideoId"
        value={
          lesson.video_provider === "bunny" ? (lesson.bunny_video_id ?? "") : ""
        }
      />
      <div className="space-y-2">
        <input
          name="title"
          defaultValue={state.values?.title ?? lesson.title}
          className="field bg-background/60 py-2.5"
        />
        <ErrorText message={state.fieldErrors?.title?.[0]} />
      </div>
      <select
        name="folderId"
        defaultValue={state.values?.folderId ?? lesson.folder_id ?? ""}
        className="field bg-background/60 py-2.5 text-xs"
        aria-label="فولدر الحصة"
      >
        <option value="">بدون فولدر</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
      <input
        name="videoFile"
        type="file"
        accept="video/*"
        className="field bg-background/60 py-2.5 text-xs"
        aria-label="فيديو الحصة"
      />
      <input
        name="youtubeUrl"
        type="url"
        dir="ltr"
        defaultValue={state.values?.youtubeUrl ?? lesson.youtube_url ?? ""}
        className="field bg-background/60 py-2.5 text-left text-xs lg:col-span-2"
        placeholder="ادخل URL اليوتيوب"
        aria-label="ادخل URL اليوتيوب"
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
      <input
        name="attachmentTitle"
        defaultValue={state.values?.attachmentTitle ?? ""}
        className="field bg-background/60 py-2.5 text-xs lg:col-span-2"
        placeholder="عنوان مرفق اختياري"
      />
      <input
        name="attachmentFile"
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,application/pdf"
        className="field bg-background/60 py-2.5 text-xs lg:col-span-2"
        aria-label="مرفق الحصة"
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
        <ErrorText message={state.fieldErrors?.youtubeUrl?.[0]} />
        <ErrorText message={state.fieldErrors?.attachmentFile?.[0]} />
        {uploadError ? <ErrorText message={uploadError} /> : null}
        {uploadProgress !== null ? (
          <p className="text-primary-700 mb-2 text-sm font-bold">
            جاري رفع الفيديو: {uploadProgress.toLocaleString("ar-EG")}%
          </p>
        ) : null}
        <FormFeedback state={state} />
      </div>
      <div className="lg:col-span-5">
        <LessonQuizFields
          initialQuestions={[...lesson.lesson_quiz_questions].sort(
            (a, b) => a.order_index - b.order_index,
          )}
        />
      </div>
    </form>
  );
}

function RenameFolderForm({
  courseId,
  folder,
}: {
  courseId: string;
  folder: TeacherLessonFolder;
}) {
  const [state, formAction, isPending] = useActionState(
    updateLessonFolderAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="flex min-w-0 flex-1 gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="folderId" value={folder.id} />
      <input
        name="name"
        defaultValue={state.values?.name ?? folder.name}
        className="field bg-background/60 min-w-0 flex-1 py-2 text-sm"
        aria-label={`اسم فولدر ${folder.name}`}
      />
      <button
        type="submit"
        disabled={isPending}
        className="btn-secondary shrink-0 px-3 py-2 text-xs"
      >
        {isPending ? "..." : "حفظ"}
      </button>
      <ErrorText message={state.fieldErrors?.name?.[0]} />
    </form>
  );
}

function LessonFolderManager({
  courseId,
  folders,
  lessons,
}: {
  courseId: string;
  folders: TeacherLessonFolder[];
  lessons: TeacherLesson[];
}) {
  const [state, formAction, isPending] = useActionState(
    createLessonFolderAction,
    initialActionState,
  );

  return (
    <section className="card-modern space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">تنظيم المحتوى</p>
          <h3 className="text-lg font-black">فولدرات الحصص</h3>
          <p className="text-foreground/55 mt-1 text-xs font-bold">
            اعمل مجموعة باسم واضح، وبعدها اختارها عند إضافة أو تعديل أي حصة.
          </p>
        </div>
        <span className="chip">
          {folders.length.toLocaleString("ar-EG")} فولدر
        </span>
      </div>

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="courseId" value={courseId} />
        <input
          name="name"
          defaultValue={state.values?.name ?? ""}
          className="field bg-background/60 flex-1 py-2.5"
          placeholder="مثال: شرح الوحدة الأولى"
          aria-label="اسم فولدر جديد"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary shrink-0"
        >
          {isPending ? "جاري الإنشاء..." : "إنشاء فولدر"}
        </button>
      </form>
      <FormFeedback state={state} />
      <ErrorText message={state.fieldErrors?.name?.[0]} />

      {folders.length > 0 ? (
        <div className="grid gap-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-primary-50/45 flex flex-wrap items-center gap-3 rounded-xl p-3"
            >
              <div className="bg-primary-100 text-primary-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4l1.5 2h6.5a2.25 2.25 0 0 1 2.25 2.25v8.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25v-10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <RenameFolderForm courseId={courseId} folder={folder} />
              <span className="text-foreground/50 text-xs font-bold">
                {lessons
                  .filter((lesson) => lesson.folder_id === folder.id)
                  .length.toLocaleString("ar-EG")}{" "}
                حصة
              </span>
              <form action={deleteLessonFolderAction}>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="folderId" value={folder.id} />
                <button
                  type="submit"
                  className="btn-secondary px-3 py-2 text-xs text-red-700"
                >
                  حذف الفولدر
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-foreground/50 border-primary-200 rounded-xl border border-dashed px-4 py-3 text-sm font-bold">
          لسه مفيش فولدرات. ابدأ بإنشاء أول مجموعة للحصص.
        </p>
      )}
    </section>
  );
}

// Kept as a reusable section primitive for future folder-only views.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LessonFolderSection({
  name,
  count,
  children,
}: {
  name: string;
  count: number;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section
      className="border-b last:border-b-0"
      style={{ borderColor: "rgb(208 227 218 / 0.55)" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="bg-primary-50/35 hover:bg-primary-50/65 flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors"
      >
        <span className="flex min-w-0 items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className={`text-primary-700 h-5 w-5 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
            fill="none"
          >
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="truncate font-black">{name}</span>
        </span>
        <span className="text-foreground/50 shrink-0 text-xs font-bold">
          {count.toLocaleString("ar-EG")} حصة
        </span>
      </button>
      {isOpen ? <div>{children}</div> : null}
    </section>
  );
}

// Kept as a reusable lesson card primitive for future compact views.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LessonCard({
  lesson,
  index,
  courseId,
  courseThumbnailUrl,
  courses,
  folders,
  selectedIds,
  setSelectedIds,
  moveDraggedLesson,
}: {
  lesson: TeacherLesson;
  index: number;
  courseId: string;
  courseThumbnailUrl: string | null;
  courses: { id: string; title: string }[];
  folders: TeacherLessonFolder[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  moveDraggedLesson: (sourceId: string, targetId: string) => void;
}) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", lesson.id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        moveDraggedLesson(event.dataTransfer.getData("text/plain"), lesson.id);
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
          {courseThumbnailUrl ? (
            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={courseThumbnailUrl}
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
          <span className="text-foreground/55 rounded-lg bg-white/65 px-2.5 py-1 text-xs font-black">
            {lesson.video_provider === "youtube" ? "YouTube" : "Bunny"}
          </span>
          <p className="text-sm font-black">
            اسحب لإعادة الترتيب ثم اضغط حفظ الترتيب
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      <LessonEditForm lesson={lesson} courseId={courseId} folders={folders} />
      {lesson.lesson_attachments.length > 0 ? (
        <div className="grid gap-2">
          {lesson.lesson_attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-primary-50/40 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold"
            >
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary-700 hover:underline"
              >
                {attachment.title}
                {attachment.file_size
                  ? ` - ${formatFileSize(attachment.file_size)}`
                  : ""}
              </a>
              <form action={deleteLessonAttachmentAction}>
                <input type="hidden" name="courseId" value={courseId} />
                <input
                  type="hidden"
                  name="attachmentId"
                  value={attachment.id}
                />
                <button className="btn-secondary px-2.5 py-1.5 text-xs text-red-700">
                  حذف المرفق
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}
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
        <button className="btn-secondary px-3 py-2 text-xs">نقل الحصة</button>
      </form>
    </article>
  );
}

export function LessonManager({
  courseId,
  courseThumbnailUrl,
  lessons,
  folders,
  courses,
}: {
  courseId: string;
  courseThumbnailUrl: string | null;
  lessons: TeacherLesson[];
  folders: TeacherLessonFolder[];
  courses: { id: string; title: string }[];
}) {
  const serverOrderKey = lessons.map((lesson) => lesson.id).join(",");
  const [orderedLessonIds, setOrderedLessonIds] = useState(() =>
    lessons.map((lesson) => lesson.id),
  );
  const [syncedOrderKey, setSyncedOrderKey] = useState(serverOrderKey);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<string[]>([]);

  // Drop the local drag order whenever the server sends a different lesson order.
  if (syncedOrderKey !== serverOrderKey) {
    setSyncedOrderKey(serverOrderKey);
    setOrderedLessonIds(lessons.map((lesson) => lesson.id));
  }

  const orderedLessons = useMemo(() => {
    const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    return orderedLessonIds
      .map((lessonId) => lessonsById.get(lessonId))
      .filter(Boolean) as TeacherLesson[];
  }, [lessons, orderedLessonIds]);

  const displayLessons = useMemo(() => {
    const grouped = folders.flatMap((folder) =>
      orderedLessons.filter((lesson) => lesson.folder_id === folder.id),
    );
    const ungrouped = orderedLessons.filter((lesson) => !lesson.folder_id);

    return [...grouped, ...ungrouped];
  }, [folders, orderedLessons]);

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
      <CreateLessonForm courseId={courseId} folders={folders} />

      <LessonFolderManager
        courseId={courseId}
        folders={folders}
        lessons={lessons}
      />

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
        {displayLessons.length > 0 ? (
          displayLessons.map((lesson, index) => {
            const folder = lesson.folder_id
              ? folders.find((item) => item.id === lesson.folder_id)
              : undefined;
            const isFolderStart = Boolean(
              folder &&
              (index === 0 ||
                displayLessons[index - 1].folder_id !== folder.id),
            );
            const isCollapsed = folder
              ? collapsedFolderIds.includes(folder.id)
              : false;

            return (
              <div key={`${lesson.id}-wrapper`}>
                {isFolderStart && folder ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedFolderIds((current) =>
                        current.includes(folder.id)
                          ? current.filter((id) => id !== folder.id)
                          : [...current, folder.id],
                      )
                    }
                    aria-expanded={!isCollapsed}
                    className="bg-primary-50/35 hover:bg-primary-50/65 flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className={`text-primary-700 h-5 w-5 shrink-0 transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                        fill="none"
                      >
                        <path
                          d="m6 9 6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      <span className="truncate font-black">{folder.name}</span>
                    </span>
                    <span className="text-foreground/50 shrink-0 text-xs font-bold">
                      {displayLessons
                        .filter((item) => item.folder_id === folder.id)
                        .length.toLocaleString("ar-EG")}{" "}
                      حصة
                    </span>
                  </button>
                ) : null}
                {isCollapsed ? null : (
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
                        {courseThumbnailUrl ? (
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={courseThumbnailUrl}
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
                        <span className="text-foreground/55 rounded-lg bg-white/65 px-2.5 py-1 text-xs font-black">
                          {lesson.video_provider === "youtube"
                            ? "YouTube"
                            : "Bunny"}
                        </span>
                        <p className="text-sm font-black">
                          اسحب لإعادة الترتيب ثم اضغط حفظ الترتيب
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <form action={deleteLessonAction}>
                          <input
                            type="hidden"
                            name="courseId"
                            value={courseId}
                          />
                          <input
                            type="hidden"
                            name="lessonId"
                            value={lesson.id}
                          />
                          <button
                            type="submit"
                            className="btn-secondary px-3 py-2 text-xs text-red-700"
                          >
                            حذف
                          </button>
                        </form>
                      </div>
                    </div>
                    <LessonEditForm
                      lesson={lesson}
                      courseId={courseId}
                      folders={folders}
                    />
                    {lesson.lesson_attachments.length > 0 ? (
                      <div className="grid gap-2">
                        {lesson.lesson_attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="bg-primary-50/40 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold"
                          >
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-700 hover:underline"
                            >
                              {attachment.title}
                              {attachment.file_size
                                ? ` - ${formatFileSize(attachment.file_size)}`
                                : ""}
                            </a>
                            <form action={deleteLessonAttachmentAction}>
                              <input
                                type="hidden"
                                name="courseId"
                                value={courseId}
                              />
                              <input
                                type="hidden"
                                name="attachmentId"
                                value={attachment.id}
                              />
                              <button className="btn-secondary px-2.5 py-1.5 text-xs text-red-700">
                                حذف المرفق
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : null}
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
                )}
              </div>
            );
          })
        ) : (
          <p className="text-foreground/60 px-5 py-10 text-center">
            لا توجد حصص لهذا الكورس حتى الآن.
          </p>
        )}
      </div>
    </div>
  );
}
