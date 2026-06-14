import { z } from "zod";

const imageSchema = z
  .instanceof(File)
  .optional()
  .refine((file) => !file || file.size === 0 || file.size <= 3 * 1024 * 1024, {
    message: "الصورة يجب ألا تتجاوز 3MB.",
  })
  .refine(
    (file) =>
      !file ||
      file.size === 0 ||
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    {
      message: "الصورة يجب أن تكون JPG أو PNG أو WEBP.",
    },
  );

export const courseSchema = z.object({
  title: z.string().trim().min(3, "عنوان الكورس مطلوب بحد أدنى 3 حروف."),
  description: z.string().trim().max(1200, "الوصف طويل جدًا.").optional(),
  price: z.coerce
    .number({ error: "السعر مطلوب." })
    .min(0, "السعر لا يمكن أن يكون أقل من صفر.")
    .max(100000, "السعر أكبر من الحد المسموح."),
  thumbnail: imageSchema,
});

export const lessonSchema = z.object({
  courseId: z.uuid("الكورس غير صحيح."),
  title: z.string().trim().min(3, "عنوان الحصة مطلوب بحد أدنى 3 حروف."),
  vdocipherVideoId: z.string().trim().optional(),
  durationMinutes: z.coerce
    .number()
    .min(0, "المدة لا يمكن أن تكون أقل من صفر.")
    .max(1000, "المدة أكبر من الحد المسموح.")
    .optional(),
  isFreePreview: z.coerce.boolean().optional(),
});

export const lessonUpdateSchema = lessonSchema.extend({
  lessonId: z.uuid("الحصة غير صحيحة."),
});

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "كود الخصم مطلوب بحد أدنى 3 حروف.")
      .max(32, "كود الخصم طويل جدًا.")
      .regex(/^[A-Za-z0-9_-]+$/, "استخدم حروف وأرقام وشرطة فقط."),
    discountType: z.enum(["percentage", "fixed"], {
      error: "اختار نوع الخصم.",
    }),
    discountValue: z.coerce
      .number({ error: "قيمة الخصم مطلوبة." })
      .positive("قيمة الخصم يجب أن تكون أكبر من صفر."),
    usageLimit: z.coerce
      .number()
      .int("حد الاستخدام يجب أن يكون رقمًا صحيحًا.")
      .positive("حد الاستخدام يجب أن يكون أكبر من صفر.")
      .optional(),
    expiresAt: z.string().trim().optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .refine(
    (value) =>
      value.discountType !== "percentage" || value.discountValue <= 100,
    {
      message: "النسبة لا يمكن أن تتجاوز 100%.",
      path: ["discountValue"],
    },
  );

export const couponUpdateSchema = couponSchema.extend({
  couponId: z.uuid("الكوبون غير صحيح."),
});
