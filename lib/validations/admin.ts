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

export const orderRejectSchema = z.object({
  orderId: z.string().uuid("الطلب غير صحيح."),
  rejectionReason: z
    .string()
    .trim()
    .min(3, "اكتب سبب الإلغاء أو الاسترجاع.")
    .max(300, "سبب الإلغاء لا يزيد عن 300 حرف."),
});

export const orderAcceptSchema = z.object({
  orderId: z.string().uuid("الطلب غير صحيح."),
});
