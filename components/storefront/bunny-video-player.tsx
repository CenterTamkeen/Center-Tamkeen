"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BunnyVideoStatus = {
  status: number | null;
  isPlayable: boolean;
  hasFailed: boolean;
  label: string;
  encodeProgress?: number | null;
  storageSize?: number | null;
  length?: number | null;
};

type LessonProgressStatus = "not_started" | "in_progress" | "completed";

type BunnyVideoPlayerProps = {
  lessonId: string;
  courseId?: string;
  title: string;
  posterUrl?: string | null;
  lessonDurationSeconds?: number | null;
  watermarkName?: string | null;
  watermarkEmail?: string | null;
  initialStatus?: BunnyVideoStatus;
  initialProgressStatus?: LessonProgressStatus;
  completedContent?: ReactNode;
};

const defaultStatus: BunnyVideoStatus = {
  status: null,
  isPlayable: false,
  hasFailed: false,
  label: "جاري التحقق من حالة الفيديو.",
  encodeProgress: null,
};

export function BunnyVideoPlayer({
  lessonId,
  courseId,
  title,
  posterUrl,
  lessonDurationSeconds,
  watermarkName,
  watermarkEmail,
  initialStatus,
  initialProgressStatus = "not_started",
  completedContent,
}: BunnyVideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(!posterUrl);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState("");
  const [progressStatus, setProgressStatus] = useState<LessonProgressStatus>(
    initialProgressStatus,
  );
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState("");
  const playerRef = useRef<HTMLDivElement | null>(null);
  const startRecordedRef = useRef(initialProgressStatus !== "not_started");
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<BunnyVideoStatus>(
    initialStatus ?? defaultStatus,
  );
  const shouldPoll = Boolean(!status.isPlayable && !status.hasFailed);
  const effectiveDurationSeconds =
    lessonDurationSeconds ?? status.length ?? null;
  const watermarkText = [watermarkName, watermarkEmail]
    .filter(Boolean)
    .join(" • ");
  const progressText = useMemo(() => {
    if (typeof status.encodeProgress !== "number") {
      return null;
    }

    return `${Math.round(status.encodeProgress).toLocaleString("ar-EG")}%`;
  }, [status.encodeProgress]);

  const saveProgress = useCallback(
    async (nextStatus: "in_progress" | "completed") => {
      if (!courseId || progressStatus === "completed") {
        return;
      }

      if (nextStatus === "in_progress" && startRecordedRef.current) {
        return;
      }

      setProgressSaving(true);
      setProgressError("");

      try {
        const response = await fetch("/api/course-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            lessonId,
            status: nextStatus,
          }),
        });

        if (!response.ok) {
          setProgressError("تعذر حفظ تقدم الحصة.");
          return;
        }

        if (nextStatus === "in_progress") {
          startRecordedRef.current = true;
        }

        setProgressStatus(nextStatus);
      } catch {
        setProgressError("تعذر حفظ تقدم الحصة.");
      } finally {
        setProgressSaving(false);
      }
    },
    [courseId, lessonId, progressStatus],
  );

  function handleStart() {
    setHasStarted(true);
    void saveProgress("in_progress");
  }

  function handleIframeLoad() {
    if (hasStarted) {
      void saveProgress("in_progress");
    }
  }
  async function toggleExpanded() {
    const player = playerRef.current;

    if (!player || !document.fullscreenEnabled) {
      return;
    }

    if (document.fullscreenElement === player) {
      await document.exitFullscreen();
      return;
    }

    await player.requestFullscreen();
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsExpanded(document.fullscreenElement === playerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (
      !hasStarted ||
      !courseId ||
      progressStatus === "completed" ||
      !status.isPlayable ||
      !effectiveDurationSeconds
    ) {
      return;
    }

    const completeAfterSeconds =
      effectiveDurationSeconds <= 30
        ? effectiveDurationSeconds * 0.9
        : Math.max(
            20,
            Math.min(
              effectiveDurationSeconds - 5,
              effectiveDurationSeconds * 0.95,
            ),
          );
    const timeout = window.setTimeout(() => {
      void saveProgress("completed");
    }, completeAfterSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [
    hasStarted,
    courseId,
    progressStatus,
    status.isPlayable,
    effectiveDurationSeconds,
    saveProgress,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlaybackUrl() {
      try {
        const response = await fetch(
          `/api/bunny/playback?lessonId=${encodeURIComponent(lessonId)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setPlaybackError("الفيديو غير متاح حاليًا.");
          return;
        }

        const data = (await response.json()) as { embedUrl?: string };
        setEmbedUrl(data.embedUrl ?? null);
      } catch {
        if (!controller.signal.aborted) {
          setPlaybackError("تعذر تجهيز تشغيل الفيديو.");
        }
      }
    }

    loadPlaybackUrl();

    return () => {
      controller.abort();
    };
  }, [lessonId]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const controller = new AbortController();
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/bunny/video-status?lessonId=${encodeURIComponent(lessonId)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const nextStatus = (await response.json()) as BunnyVideoStatus;
        setStatus(nextStatus);
      } catch {
        // Keep the current status while the next poll retries.
      }
    }, 10000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [shouldPoll, lessonId]);

  if (!embedUrl) {
    return (
      <div className="bg-foreground/5 text-foreground/55 flex aspect-video items-center justify-center rounded-xl px-4 text-center text-sm font-bold">
        {playbackError || "جاري تجهيز تشغيل الفيديو."}
      </div>
    );
  }

  if (!status.isPlayable) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-black px-5 text-center text-white">
        <p className="text-lg font-black">
          {status.hasFailed ? "تعذر تجهيز الفيديو" : "الفيديو قيد المعالجة"}
        </p>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
          {status.label}
          {progressText ? ` (${progressText})` : ""}
        </p>
        {!status.hasFailed ? (
          <p className="mt-2 text-xs text-white/45">
            سيتم تشغيله تلقائيًا هنا بعد انتهاء Bunny من المعالجة.
          </p>
        ) : null}
      </div>
    );
  }

  if (posterUrl && !hasStarted) {
    return (
      <button
        type="button"
        onClick={handleStart}
        className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black text-white"
        aria-label={`تشغيل ${title}`}
      >
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 760px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-black/35 transition group-hover:bg-black/25" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary-700 flex h-16 w-16 items-center justify-center rounded-full bg-white/92 shadow-[var(--shadow-card)] transition group-hover:scale-105">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="mr-0.5"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
        <span className="absolute right-4 bottom-4 left-4 text-right">
          <span className="inline-flex rounded-xl bg-black/60 px-3 py-2 text-sm font-black backdrop-blur">
            {progressStatus === "completed"
              ? "إعادة تشغيل الحصة"
              : "تشغيل الحصة"}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={playerRef}
        className="video-player-shell relative aspect-video overflow-hidden rounded-xl bg-black"
      >
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media;"
          onLoad={handleIframeLoad}
        />
        <button
          type="button"
          onClick={() => void toggleExpanded()}
          className="video-fullscreen-btn absolute right-[6px] bottom-[2px] z-20 flex h-[48px] w-[48px] items-center justify-center text-white/90 transition-all hover:text-white focus:outline-none"
          aria-label={isExpanded ? "تصغير الفيديو" : "تكبير الفيديو"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isExpanded ? (
              <>
                <path d="M8 3v5H3" />
                <path d="M16 3v5h5" />
                <path d="M8 21v-5H3" />
                <path d="M16 21v-5h5" />
              </>
            ) : (
              <>
                <path d="M8 3H3v5" />
                <path d="M16 3h5v5" />
                <path d="M8 21H3v-5" />
                <path d="M16 21h5v-5" />
              </>
            )}
          </svg>
        </button>
        {watermarkText ? (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden text-white/25 select-none">
            <div className="video-watermark rounded-full border border-white/3 bg-black/5 px-3 py-1.5 text-right text-xs leading-5 font-black sm:text-sm">
              {watermarkText}
            </div>
          </div>
        ) : null}
      </div>
      {courseId ? (
        <div className="border-border/70 bg-surface-muted/55 rounded-xl border px-3 py-2.5">
          <p className="text-foreground/65 text-sm font-bold">
            {progressStatus === "completed"
              ? "تم احتساب الحصة ضمن تقدمك."
              : effectiveDurationSeconds
                ? "سيتم احتساب الحصة تلقائيًا عند الوصول لنهاية الفيديو."
                : "تم تسجيل بداية الحصة، وسيتم حساب اكتمالها عند توفر مدة الفيديو."}
          </p>
          {progressSaving ? (
            <p className="text-foreground/45 mt-1 text-xs font-bold">
              جاري حفظ التقدم...
            </p>
          ) : null}
          {progressError ? (
            <p className="text-danger mt-1 text-xs font-bold">
              {progressError}
            </p>
          ) : null}
        </div>
      ) : null}
      {progressStatus === "completed" && completedContent ? (
        <div className="animate-fade-up">{completedContent}</div>
      ) : null}
    </div>
  );
}
