"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LockClosedIcon } from "@/components/ui/icons";
import { formatDuration } from "@/lib/format";
import type {
  CourseLessonDetails,
  CourseLessonFolder,
} from "@/lib/storefront/data";

type CourseLessonsOutlineProps = {
  lessons: CourseLessonDetails[];
  folders: CourseLessonFolder[];
  lessonCount: number;
  courseHref: string;
  courseThumbnailUrl: string | null;
  isEnrolled: boolean;
  playableLessonId?: string;
  progress: { lessonId: string; status: string }[];
};

function LessonProgressBadge({
  isEnrolled,
  isStarted,
  isCompleted,
}: {
  isEnrolled: boolean;
  isStarted: boolean;
  isCompleted: boolean;
}) {
  if (!isEnrolled) {
    return null;
  }

  if (isCompleted) {
    return (
      <span className="bg-primary-50 text-primary-700 rounded-lg px-2.5 py-1 text-xs font-black">
        مكتملة
      </span>
    );
  }

  if (isStarted) {
    return (
      <span className="bg-accent-50 text-accent-700 rounded-lg px-2.5 py-1 text-xs font-black">
        بدأت
      </span>
    );
  }

  return (
    <span className="text-foreground/45 inline-flex items-center gap-2 text-xs font-black">
      لم تبدأ
    </span>
  );
}

export function CourseLessonsOutline({
  lessons,
  folders,
  lessonCount,
  courseHref,
  courseThumbnailUrl,
  isEnrolled,
  playableLessonId,
  progress,
}: CourseLessonsOutlineProps) {
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<string[]>([]);
  const progressByLessonId = new Map(
    progress.map((item) => [item.lessonId, item.status]),
  );
  const lessonNumberById = new Map(
    lessons.map((lesson, index) => [lesson.id, index + 1]),
  );
  const ungroupedLessons = lessons.filter((lesson) => !lesson.folder_id);

  function toggleFolder(folderId: string) {
    setCollapsedFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  }

  function renderLesson(lesson: CourseLessonDetails) {
    const isCurrentLesson = playableLessonId === lesson.id;
    const canPlay =
      isEnrolled && Boolean(lesson.bunny_video_id || lesson.youtube_video_id);
    const isLocked = !isEnrolled && !lesson.is_free_preview;
    const lessonUrl = canPlay
      ? `${courseHref}?lesson=${lesson.id}#study`
      : undefined;
    const progressStatus = progressByLessonId.get(lesson.id);
    const lessonNumber = lessonNumberById.get(lesson.id) ?? 0;

    const content = (
      <>
        <div className="flex min-w-0 items-center gap-3">
          {courseThumbnailUrl ? (
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={courseThumbnailUrl}
                alt={lesson.title}
                fill
                sizes="80px"
                className="object-cover"
              />
              {isCurrentLesson ? (
                <div className="from-primary-500/80 absolute inset-0 flex items-center justify-center bg-gradient-to-br to-transparent">
                  <svg
                    className="h-6 w-6 text-white drop-shadow"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : null}
            </div>
          ) : null}
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
              isCurrentLesson
                ? "bg-primary-500 text-white"
                : "text-foreground/45"
            }`}
            style={
              isCurrentLesson
                ? undefined
                : { background: "rgb(236 245 241 / 0.6)" }
            }
          >
            {lessonNumber.toLocaleString("ar-EG")}
          </span>
          <div className="min-w-0">
            <h3
              className={`font-bold transition-colors duration-300 ${
                isCurrentLesson
                  ? "text-primary-700"
                  : "group-hover:text-primary-700"
              }`}
            >
              {lesson.title}
            </h3>
            <p className="text-foreground/50 text-sm">
              {formatDuration(lesson.duration)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LessonProgressBadge
            isEnrolled={isEnrolled}
            isStarted={Boolean(progressStatus)}
            isCompleted={progressStatus === "completed"}
          />
          {isCurrentLesson ? (
            <span className="bg-primary-500 animate-pulse rounded-lg px-2.5 py-1 text-xs font-black text-white">
              قيد التشغيل
            </span>
          ) : null}
          {lesson.is_free_preview ? (
            <span
              className="badge-pulse text-primary-700 rounded-lg px-2.5 py-1 text-xs font-black"
              style={{
                background:
                  "linear-gradient(135deg, rgb(231 245 241 / 0.9), rgb(197 232 223 / 0.5))",
              }}
            >
              Preview
            </span>
          ) : !isEnrolled ? (
            <span className="text-foreground/45 inline-flex items-center gap-1.5 text-xs font-black">
              {isLocked ? <LockClosedIcon className="size-3.5" /> : null}
              {isLocked ? "اشترك لفتح الحصة" : "متاحة Preview"}
            </span>
          ) : null}
        </div>
      </>
    );

    if (lessonUrl) {
      return (
        <Link
          key={lesson.id}
          href={lessonUrl}
          scroll={false}
          className={`group grid gap-4 border-b px-3 py-4 transition-all duration-300 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5 ${
            isCurrentLesson ? "bg-primary-50/50" : "hover:bg-primary-50/30"
          }`}
          style={{ borderColor: "rgb(208 227 218 / 0.4)" }}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={lesson.id}
        className="group grid gap-4 border-b px-3 py-4 transition-all duration-300 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
        style={{ borderColor: "rgb(208 227 218 / 0.4)" }}
      >
        {content}
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">خطة الدراسة</p>
          <h2 className="heading-gradient text-2xl font-black">محتوى الكورس</h2>
        </div>
        <span className="chip">{lessonCount.toLocaleString("ar-EG")} حصة</span>
      </div>

      <div className="glass-panel-strong space-y-2 overflow-hidden rounded-2xl p-2 sm:p-3">
        {lessons.length > 0 ? (
          <>
            {folders.map((folder) => {
              const folderLessons = lessons.filter(
                (lesson) => lesson.folder_id === folder.id,
              );
              const isCollapsed = collapsedFolderIds.includes(folder.id);
              const folderLessonsId = `folder-lessons-${folder.id}`;

              return (
                <section
                  key={folder.id}
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: "rgb(208 227 218 / 0.55)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    aria-expanded={!isCollapsed}
                    aria-controls={folderLessonsId}
                    className="bg-primary-50/55 hover:bg-primary-50 flex w-full items-center justify-between gap-3 px-3 py-3 text-right transition-colors sm:px-4"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="bg-primary-100 text-primary-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z" />
                          <path d="M3.5 8h17" />
                        </svg>
                      </span>
                      <span className="truncate font-black">{folder.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-foreground/50 text-xs font-bold">
                        {folderLessons.length.toLocaleString("ar-EG")} حصة
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className={`text-primary-700 h-5 w-5 transition-transform duration-300 ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  <div id={folderLessonsId} hidden={isCollapsed}>
                    {folderLessons.length > 0 ? (
                      folderLessons.map(renderLesson)
                    ) : (
                      <p className="text-foreground/50 px-4 py-5 text-sm font-bold">
                        لا توجد حصص في هذا الفولدر حتى الآن.
                      </p>
                    )}
                  </div>
                </section>
              );
            })}

            {ungroupedLessons.length > 0 ? (
              <section
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: "rgb(208 227 218 / 0.55)" }}
              >
                {folders.length > 0 ? (
                  <div className="bg-primary-50/30 px-4 py-3 text-sm font-black">
                    حصص بدون فولدر
                  </div>
                ) : null}
                {ungroupedLessons.map(renderLesson)}
              </section>
            ) : null}
          </>
        ) : (
          <p className="text-foreground/60 px-5 py-10 text-center">
            لا توجد حصص منشورة في هذا الكورس حاليًا.
          </p>
        )}
      </div>
    </>
  );
}
