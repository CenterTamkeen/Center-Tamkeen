import { z } from "zod";

import { passwordRegex } from "@/lib/validations/auth";

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
  subject: z.string().trim().min(1, "اسم المادة مطلوب."),
  email: z.string().trim().email("اكتب بريد إلكتروني صحيح."),
  password: z
    .string()
    .regex(
      passwordRegex,
      "كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي حرف كبير وصغير ورقم.",
    ),
});

export const orderRejectSchema = z.object({
  orderId: z.string().uuid("الطلب غير صحيح."),
  rejectionReason: z
    .string()
    .trim()
    .min(3, "اكتب سبب الإلغاء أو الاسترجاع.")
    .max(300, "سبب الإلغاء لا يزيد عن 300 حرف."),
});
