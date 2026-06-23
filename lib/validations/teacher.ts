import { z } from "zod";

import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

const gradeValues = Object.keys(gradeLabels) as [string, ...string[]];
const sectionValues = Object.keys(sectionLabels) as [string, ...string[]];

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

const videoSchema = z
  .instanceof(File)
  .optional()
  .refine((file) => !file || file.size === 0 || file.size <= 2 * 1024 ** 3, {
    message: "الفيديو يجب ألا يتجاوز 2GB.",
  })
  .refine(
    (file) => !file || file.size === 0 || file.type.startsWith("video/"),
    {
      message: "ارفع ملف فيديو صحيح.",
    },
  );

const attachmentSchema = z
  .instanceof(File)
  .optional()
  .refine((file) => !file || file.size === 0 || file.size <= 20 * 1024 * 1024, {
    message: "المرفق يجب ألا يتجاوز 20MB.",
  })
  .refine(
    (file) =>
      !file ||
      file.size === 0 ||
      [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ].includes(file.type),
    {
      message: "ارفع PDF أو صورة أو ملف Word/PowerPoint.",
    },
  );

const quizQuestionSchema = z.object({
  question: z.string().trim().min(3, "اكتب نص السؤال."),
  options: z
    .array(z.string().trim().min(1, "كل اختيار مطلوب."))
    .length(4, "كل سؤال لازم يكون له 4 اختيارات."),
  correctOptionIndex: z.coerce
    .number()
    .int()
    .min(0, "اختار الإجابة الصحيحة.")
    .max(3, "اختار الإجابة الصحيحة."),
});

export const courseSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(2, "اسم المادة مطلوب بحد أدنى حرفين.")
    .max(80, "اسم المادة طويل جدًا."),
  title: z.string().trim().min(3, "عنوان الكورس مطلوب بحد أدنى 3 حروف."),
  description: z.string().trim().max(1200, "الوصف طويل جدًا.").optional(),
  price: z.coerce
    .number({ error: "السعر مطلوب." })
    .min(0, "السعر لا يمكن أن يكون أقل من صفر.")
    .max(100000, "السعر أكبر من الحد المسموح."),
  targetGrade: z.enum(gradeValues).optional().or(z.literal("")),
  targetSection: z.enum(sectionValues).optional().or(z.literal("")),
  thumbnail: imageSchema,
});

export const lessonSchema = z.object({
  courseId: z.uuid("الكورس غير صحيح."),
  title: z.string().trim().min(3, "عنوان الحصة مطلوب بحد أدنى 3 حروف."),
  bunnyVideoId: z.string().trim().optional(),
  videoFile: videoSchema,
  attachmentFile: attachmentSchema,
  attachmentTitle: z
    .string()
    .trim()
    .max(120, "اسم المرفق طويل جدًا.")
    .optional(),
  quizQuestions: z
    .array(quizQuestionSchema)
    .max(50, "عدد الأسئلة أكبر من المسموح.")
    .optional(),
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
    courseId: z.uuid("اختار كورس صحيح."),
    usageLimit: z.coerce
      .number()
      .int("حد الاستخدام يجب أن يكون رقمًا صحيحًا.")
      .positive("حد الاستخدام يجب أن يكون أكبر من صفر.")
      .optional(),
    targetStudentId: z.uuid("اختار طالب صحيح.").optional(),
    targetStudentIds: z.array(z.uuid("اختار طالب صحيح.")).optional(),
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
