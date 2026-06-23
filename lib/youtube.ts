const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function extractYouTubeVideoId(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(host)) {
      return null;
    }

    if (host.endsWith("youtu.be")) {
      return normalizeYouTubeId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (url.pathname === "/watch") {
      return normalizeYouTubeId(url.searchParams.get("v"));
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const markerIndex = parts.findIndex((part) =>
      ["embed", "shorts", "live"].includes(part),
    );

    if (markerIndex >= 0) {
      return normalizeYouTubeId(parts[markerIndex + 1]);
    }
  } catch {
    return normalizeYouTubeId(trimmed);
  }

  return null;
}

export function buildYouTubeEmbedUrl(videoId: string | null | undefined) {
  const normalizedVideoId = normalizeYouTubeId(videoId);

  if (!normalizedVideoId) {
    return null;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
  });

  return `https://www.youtube-nocookie.com/embed/${normalizedVideoId}?${params.toString()}`;
}

function normalizeYouTubeId(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || !/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}
