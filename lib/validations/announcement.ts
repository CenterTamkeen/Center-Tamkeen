import { z } from "zod";

const announcementImageSchema = z
  .instanceof(File, { message: "صورة الإعلان مطلوبة." })
  .refine((file) => file.size > 0, "صورة الإعلان مطلوبة.")
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "صورة الإعلان يجب ألا تتجاوز 5MB.",
  })
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    {
      message: "صورة الإعلان يجب أن تكون JPG أو PNG أو WEBP.",
    },
  );

const optionalAnnouncementImageSchema = z
  .instanceof(File)
  .optional()
  .refine((file) => !file || file.size === 0 || file.size <= 5 * 1024 * 1024, {
    message: "صورة الإعلان يجب ألا تتجاوز 5MB.",
  })
  .refine(
    (file) =>
      !file ||
      file.size === 0 ||
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    {
      message: "صورة الإعلان يجب أن تكون JPG أو PNG أو WEBP.",
    },
  );

function isValidButtonUrl(value: string) {
  if (value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const announcementCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "اسم الإعلان مطلوب بحد أدنى حرفين.")
    .max(80, "اسم الإعلان طويل جدًا."),
  image: announcementImageSchema,
  buttonText: z
    .string()
    .trim()
    .min(2, "نص الزرار مطلوب.")
    .max(40, "نص الزرار لا يزيد عن 40 حرف."),
  buttonUrl: z
    .string()
    .trim()
    .min(1, "لينك الزرار مطلوب.")
    .max(500, "لينك الزرار طويل جدًا.")
    .refine(isValidButtonUrl, "اكتب لينك صحيح، مثال /courses أو https://..."),
  isActive: z.coerce.boolean().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.extend({
  announcementId: z.uuid("الإعلان غير صحيح."),
  image: optionalAnnouncementImageSchema,
});
