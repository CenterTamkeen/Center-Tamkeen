import { createHash } from "crypto";

const EMBED_BASE_URL = "https://player.mediadelivery.net/embed";
const API_BASE_URL = "https://video.bunnycdn.com";
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 6;

const statusLabels: Record<number, string> = {
  0: "الفيديو في قائمة المعالجة.",
  1: "جاري تجهيز بيانات الفيديو.",
  2: "جاري ترميز الفيديو.",
  3: "الفيديو جاهز للتشغيل.",
  4: "الفيديو جاهز للتشغيل.",
  5: "فشل تجهيز الفيديو.",
};

type BunnyEmbedOptions = {
  autoplay?: boolean;
  preload?: boolean;
  rememberPosition?: boolean;
};

function booleanParam(value: boolean | undefined) {
  return value ? "true" : "false";
}

export function getBunnyStreamLibraryId() {
  return process.env.BUNNY_STREAM_LIBRARY_ID?.trim() || null;
}

function getBunnyStreamApiKey() {
  return process.env.BUNNY_STREAM_API_KEY?.trim() || null;
}

export function buildBunnyStreamEmbedUrl(
  videoId: string | null | undefined,
  options: BunnyEmbedOptions = {},
) {
  const libraryId = getBunnyStreamLibraryId();
  const trimmedVideoId = videoId?.trim();

  if (!libraryId || !trimmedVideoId) {
    return null;
  }

  const url = new URL(
    `${EMBED_BASE_URL}/${encodeURIComponent(libraryId)}/${encodeURIComponent(
      trimmedVideoId,
    )}`,
  );

  url.searchParams.set("autoplay", booleanParam(options.autoplay));
  url.searchParams.set("preload", booleanParam(options.preload ?? true));
  url.searchParams.set(
    "rememberPosition",
    booleanParam(options.rememberPosition ?? true),
  );

  const tokenKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY?.trim();

  if (tokenKey) {
    const expires = Math.floor(Date.now() / 1000) + DEFAULT_EXPIRES_IN_SECONDS;
    const token = createHash("sha256")
      .update(`${tokenKey}${trimmedVideoId}${expires}`)
      .digest("hex");

    url.searchParams.set("token", token);
    url.searchParams.set("expires", String(expires));
  }

  return url.toString();
}

export function getBunnyVideoStatusInfo(status: number | null | undefined) {
  return {
    status: status ?? null,
    isPlayable: status === 3 || status === 4,
    hasFailed: status === 5,
    label: statusLabels[status ?? -1] ?? "جاري التحقق من حالة الفيديو.",
  };
}

export async function getBunnyStreamVideoStatus(
  videoId: string | null | undefined,
) {
  const libraryId = getBunnyStreamLibraryId();
  const apiKey = getBunnyStreamApiKey();
  const trimmedVideoId = videoId?.trim();

  if (!libraryId || !apiKey || !trimmedVideoId) {
    return getBunnyVideoStatusInfo(null);
  }

  const response = await fetch(
    `${API_BASE_URL}/library/${encodeURIComponent(
      libraryId,
    )}/videos/${encodeURIComponent(trimmedVideoId)}`,
    {
      headers: {
        AccessKey: apiKey,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return getBunnyVideoStatusInfo(null);
  }

  const video = (await response.json()) as {
    status?: number;
    encodeProgress?: number;
    storageSize?: number;
    length?: number;
  };

  return {
    ...getBunnyVideoStatusInfo(video.status),
    encodeProgress: video.encodeProgress ?? null,
    storageSize: video.storageSize ?? null,
    length: video.length ?? null,
  };
}

export async function deleteBunnyStreamVideo(
  videoId: string | null | undefined,
) {
  const libraryId = getBunnyStreamLibraryId();
  const apiKey = getBunnyStreamApiKey();
  const trimmedVideoId = videoId?.trim();

  if (!libraryId || !apiKey || !trimmedVideoId) {
    return;
  }

  const response = await fetch(
    `${API_BASE_URL}/library/${encodeURIComponent(
      libraryId,
    )}/videos/${encodeURIComponent(trimmedVideoId)}`,
    {
      method: "DELETE",
      headers: {
        AccessKey: apiKey,
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete Bunny Stream video.");
  }
}

export async function createBunnyStreamVideo(title: string) {
  const libraryId = getBunnyStreamLibraryId();
  const apiKey = getBunnyStreamApiKey();

  if (!libraryId || !apiKey) {
    throw new Error("Missing Bunny Stream credentials.");
  }

  const createResponse = await fetch(
    `${API_BASE_URL}/library/${encodeURIComponent(libraryId)}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!createResponse.ok) {
    throw new Error("Failed to create Bunny Stream video.");
  }

  const createdVideo = (await createResponse.json()) as {
    guid?: string;
    videoGuid?: string;
  };
  const videoId = createdVideo.guid ?? createdVideo.videoGuid;

  if (!videoId) {
    throw new Error("Bunny Stream did not return a video ID.");
  }

  return {
    libraryId,
    apiKey,
    videoId,
  };
}

export async function createBunnyStreamTusUploadCredentials(title: string) {
  const { libraryId, apiKey, videoId } = await createBunnyStreamVideo(title);
  const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const signature = createHash("sha256")
    .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
    .digest("hex");

  return {
    videoId,
    libraryId,
    expirationTime,
    signature,
  };
}

export async function uploadBunnyStreamVideo(file: File, title: string) {
  const { libraryId, apiKey, videoId } = await createBunnyStreamVideo(title);

  const uploadResponse = await fetch(
    `${API_BASE_URL}/library/${encodeURIComponent(
      libraryId,
    )}/videos/${encodeURIComponent(videoId)}`,
    {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload Bunny Stream video.");
  }

  return {
    videoId,
  };
}
