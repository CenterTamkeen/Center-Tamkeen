"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type BunnyVideoStatus = {
  status: number | null;
  isPlayable: boolean;
  hasFailed: boolean;
  label: string;
  encodeProgress?: number | null;
  storageSize?: number | null;
  length?: number | null;
};

type BunnyVideoPlayerProps = {
  lessonId: string;
  title: string;
  posterUrl?: string | null;
  initialStatus?: BunnyVideoStatus;
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
  title,
  posterUrl,
  initialStatus,
}: BunnyVideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(!posterUrl);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState("");
  const [status, setStatus] = useState<BunnyVideoStatus>(
    initialStatus ?? defaultStatus,
  );
  const shouldPoll = Boolean(!status.isPlayable && !status.hasFailed);
  const progressText = useMemo(() => {
    if (typeof status.encodeProgress !== "number") {
      return null;
    }

    return `${Math.round(status.encodeProgress).toLocaleString("ar-EG")}%`;
  }, [status.encodeProgress]);

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
        onClick={() => setHasStarted(true)}
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
            تشغيل الحصة
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}
