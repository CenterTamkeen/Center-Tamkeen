import { z } from "zod";

export const notificationTargetModes = [
  "all_students",
  "grade_section",
  "course",
  "teacher_students",
] as const;

function isSafeNotificationHref(value: string) {
  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const notificationCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "عنوان الإشعار مطلوب.")
      .max(90, "عنوان الإشعار طويل."),
    body: z
      .string()
      .trim()
      .min(2, "محتوى الإشعار مطلوب.")
      .max(300, "محتوى الإشعار طويل."),
    href: z
      .string()
      .trim()
      .min(1, "لينك الإشعار مطلوب.")
      .max(500, "لينك الإشعار طويل.")
      .refine(isSafeNotificationHref, {
        message: "اكتب لينك داخلي يبدأ بـ / أو لينك كامل https://.",
      }),
    targetMode: z.enum(notificationTargetModes, {
      message: "اختار الطلاب المستهدفين.",
    }),
    grade: z.string().optional(),
    section: z.string().optional(),
    courseId: z.string().uuid("اختار كورس صحيح.").optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.targetMode !== "grade_section" || Boolean(data.grade?.trim()),
    {
      message: "اختار الصف الدراسي.",
      path: ["grade"],
    },
  )
  .refine((data) => data.targetMode !== "course" || Boolean(data.courseId), {
    message: "اختار الكورس.",
    path: ["courseId"],
  });
