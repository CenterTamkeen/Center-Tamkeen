import { z } from "zod";

import { egyptianMobileRegex, passwordRegex } from "@/lib/validations/auth";

const teacherNameSchema = z
  .string()
  .trim()
  .min(1, "اسم المدرس مطلوب.")
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
    message: "اكتب اسم المدرس ثنائي على الأقل.",
  })
  .refine((value) => /^[\p{L}\s]+$/u.test(value), {
    message: "الاسم يقبل حروف ومسافات فقط بدون أرقام أو رموز.",
  });

export const teacherCreateSchema = z.object({
  fullName: teacherNameSchema,
  englishName: z
    .string()
    .trim()
    .min(2, "اكتب اسم المدرس بالإنجليزي.")
    .max(80, "الاسم الإنجليزي طويل.")
    .refine((value) => /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(value), {
      message: "الاسم الإنجليزي يقبل حروف إنجليزية ومسافات فقط.",
    }),
  subject: z.string().trim().min(1, "اسم المادة مطلوب."),
  phone: z
    .string()
    .trim()
    .regex(egyptianMobileRegex, "اكتب رقم موبايل مصري صحيح يبدأ بـ 01.")
    .or(z.literal("")),
  email: z.string().trim().email("اكتب بريد إلكتروني صحيح."),
  password: z
    .string()
    .regex(
      passwordRegex,
      "كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي حرف كبير وصغير ورقم.",
    ),
});

export const teacherUpdateSchema = z.object({
  teacherId: z.string().uuid("المدرس غير صحيح."),
  fullName: teacherNameSchema,
  englishName: z
    .string()
    .trim()
    .min(2, "اكتب الاسم أو الرابط بالإنجليزي.")
    .max(80, "الرابط الإنجليزي طويل.")
    .refine((value) => /^[A-Za-z0-9]+(?:[\s-]+[A-Za-z0-9]+)*$/.test(value), {
      message: "الرابط يقبل حروف وأرقام إنجليزية ومسافات أو شرطات فقط.",
    }),
  subject: z.string().trim().min(1, "اسم المادة مطلوب."),
  phone: z
    .string()
    .trim()
    .regex(egyptianMobileRegex, "اكتب رقم موبايل مصري صحيح يبدأ بـ 01.")
    .or(z.literal("")),
  isActive: z.boolean(),
});

export const activationCodeGenerateSchema = z.object({
  courseId: z.string().uuid("اختار كورس صحيح."),
  quantity: z.coerce
    .number({ error: "اكتب عدد الأكواد." })
    .int("عدد الأكواد لازم يكون رقم صحيح.")
    .min(1, "ولّد كود واحد على الأقل.")
    .max(200, "أقصى عدد في المرة الواحدة ٢٠٠ كود."),
  expiresAt: z
    .string()
    .trim()
    .min(1, "حدد تاريخ انتهاء الصلاحية.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "تاريخ انتهاء الصلاحية غير صحيح.",
    })
    .refine((value) => new Date(value) > new Date(), {
      message: "تاريخ انتهاء الصلاحية لازم يكون في المستقبل.",
    }),
});

export const activationCodeDeleteSchema = z.object({
  codeId: z.string().uuid("الكود غير صحيح."),
});
