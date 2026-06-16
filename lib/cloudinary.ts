"use server";

import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";

type CloudinaryUploadOptions = {
  folder: string;
  publicId?: string;
  overwrite?: boolean;
};

let isConfigured = false;

function getRequiredEnv(name: "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Cloudinary environment variable: ${name}`);
  }

  return value;
}

function getCloudinary() {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
      api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });

    isConfigured = true;
  }

  return cloudinary;
}

export async function uploadImage(
  file: File,
  options: CloudinaryUploadOptions,
) {
  const client = getCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadOptions: UploadApiOptions = {
    folder: options.folder,
    resource_type: "image",
    overwrite: options.overwrite ?? true,
    unique_filename: options.publicId ? false : true,
    use_filename: options.publicId ? false : true,
    public_id: options.publicId,
  };

  return new Promise<{ secureUrl: string; publicId: string }>(
    (resolve, reject) => {
      const stream = client.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      });

      stream.end(buffer);
    },
  );
}

function getPublicIdFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const uploadMarker = "/upload/";
    const markerIndex = parsedUrl.pathname.indexOf(uploadMarker);

    if (markerIndex < 0) {
      return null;
    }

    const afterUpload = parsedUrl.pathname.slice(markerIndex + uploadMarker.length);
    const segments = afterUpload.split("/").filter(Boolean);
    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments =
      versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;

    if (publicIdSegments.length === 0) {
      return null;
    }

    const publicId = publicIdSegments.join("/").replace(/\.[^.]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
}

export async function deleteImageByUrl(url?: string | null) {
  if (!url) {
    return;
  }

  const publicId = getPublicIdFromUrl(url);

  if (!publicId) {
    return;
  }

  try {
    await getCloudinary().uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
  } catch (error) {
    console.error("Failed to delete Cloudinary asset.", error);
  }
}
