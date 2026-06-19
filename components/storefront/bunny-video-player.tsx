"use client";

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
  embedUrl: string | null;
  videoId: string | null | undefined;
  title: string;
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
  embedUrl,
  videoId,
  title,
  initialStatus,
}: BunnyVideoPlayerProps) {
  const [status, setStatus] = useState<BunnyVideoStatus>(
    initialStatus ?? defaultStatus,
  );
  const shouldPoll = Boolean(
    videoId && !status.isPlayable && !status.hasFailed,
  );
  const progressText = useMemo(() => {
    if (typeof status.encodeProgress !== "number") {
      return null;
    }

    return `${Math.round(status.encodeProgress).toLocaleString("ar-EG")}%`;
  }, [status.encodeProgress]);

  useEffect(() => {
    if (!shouldPoll || !videoId) {
      return;
    }

    const controller = new AbortController();
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/bunny/video-status?videoId=${encodeURIComponent(videoId)}`,
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
  }, [shouldPoll, videoId]);

  if (!embedUrl || !videoId) {
    return (
      <div className="bg-foreground/5 text-foreground/55 flex aspect-video items-center justify-center rounded-xl px-4 text-center text-sm font-bold">
        الفيديو غير متاح حاليًا.
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
