import { z } from "zod";

export const egyptianMobileRegex = /^01[0-2,5]\d{8}$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const maxStudentPhotoSize = 2 * 1024 * 1024;
export const maxTeacherCoverSize = 5 * 1024 * 1024;
export const allowedStudentPhotoTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const gradeLabels = {
  first_secondary: "أولى ثانوي",
  second_secondary: "تانية ثانوي",
  third_secondary: "تالتة ثانوي",
} as const;

export const sectionLabels = {
  general: "عام",
  scientific: "علمي",
  literary: "أدبي",
  science: "علمي علوم",
  mathematics: "علمي رياضة",
} as const;

export const sectionsByGrade = {
  first_secondary: ["general"],
  second_secondary: ["scientific", "literary"],
  third_secondary: ["science", "mathematics", "literary"],
} as const;

const genderValues = ["male", "female"] as const;
const gradeValues = [
  "first_secondary",
  "second_secondary",
  "third_secondary",
] as const;
const sectionValues = [
  "general",
  "scientific",
  "literary",
  "science",
  "mathematics",
] as const;

function hasFileShape(value: unknown): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0 &&
    value.name.length > 0
  );
}

function getFirstFile(value: unknown) {
  if (hasFileShape(value)) {
    return value;
  }

  if (
    typeof FileList !== "undefined" &&
    value instanceof FileList &&
    value.length > 0
  ) {
    return value.item(0);
  }

  return null;
}

export function getStudentPhotoValidationMessage(value: unknown) {
  const file = getFirstFile(value);

  if (!file) {
    return null;
  }

  if (!allowedStudentPhotoTypes.includes(file.type as never)) {
    return "الصورة لازم تكون JPG أو PNG أو WEBP.";
  }

  if (file.size > maxStudentPhotoSize) {
    return "حجم الصورة لازم يكون 2MB أو أقل.";
  }

  return null;
}

export function getTeacherCoverValidationMessage(value: unknown) {
  const file = getFirstFile(value);

  if (!file) {
    return null;
  }

  if (!allowedStudentPhotoTypes.includes(file.type as never)) {
    return "الخلفية لازم تكون JPG أو PNG أو WEBP.";
  }

  if (file.size > maxTeacherCoverSize) {
    return "حجم الخلفية لازم يكون 5MB أو أقل.";
  }

  return null;
}

const accountNameSchema = z
  .string()
  .trim()
  .min(1, "الاسم مطلوب.")
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
    message: "اكتب الاسم ثنائي على الأقل.",
  })
  .refine((value) => /^[\p{L}\s]+$/u.test(value), {
    message: "الاسم يقبل حروف ومسافات فقط بدون أرقام أو رموز.",
  });

const fullNameSchema = z
  .string()
  .trim()
  .min(1, "اسم الطالب مطلوب.")
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 4, {
    message: "اكتب الاسم رباعي على الأقل.",
  })
  .refine((value) => /^[\p{L}\s]+$/u.test(value), {
    message: "الاسم يقبل حروف ومسافات فقط بدون أرقام أو رموز.",
  });

const mobileSchema = z
  .string()
  .trim()
  .regex(egyptianMobileRegex, "اكتب رقم موبايل مصري صحيح يبدأ بـ 01.");

export const loginSchema = z.object({
  email: z.string().trim().email("اكتب بريد إلكتروني صحيح."),
  password: z.string().min(1, "كلمة المرور مطلوبة."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("اكتب بريد إلكتروني صحيح."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .regex(
        passwordRegex,
        "كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي حرف كبير وصغير ورقم.",
      ),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "تأكيد كلمة المرور غير مطابق.",
    path: ["confirmPassword"],
  });

const baseStudentSignUpSchema = z
  .object({
    fullName: fullNameSchema,
    studentPhone: mobileSchema,
    fatherPhone: mobileSchema,
    schoolName: z.string().trim().min(1, "اسم المدرسة مطلوب."),
    gender: z
      .string()
      .refine((value) => genderValues.includes(value as never), {
        message: "اختار النوع.",
      }),
    grade: z.string().refine((value) => gradeValues.includes(value as never), {
      message: "اختار السنة الدراسية.",
    }),
    section: z
      .string()
      .refine((value) => sectionValues.includes(value as never), {
        message: "اختار الشعبة المناسبة.",
      }),
    email: z.string().trim().email("اكتب بريد إلكتروني صحيح."),
    password: z
      .string()
      .regex(
        passwordRegex,
        "كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي حرف كبير وصغير ورقم.",
      ),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب."),
  })
  .refine((data) => data.studentPhone !== data.fatherPhone, {
    message: "رقم ولي الأمر لازم يكون مختلف عن رقم الطالب.",
    path: ["fatherPhone"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "تأكيد كلمة المرور غير مطابق.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      sectionsByGrade[data.grade as keyof typeof sectionsByGrade]?.includes(
        data.section as never,
      ),
    {
      message: "الشعبة غير متوافقة مع السنة الدراسية.",
      path: ["section"],
    },
  );

export const studentSignUpClientSchema = baseStudentSignUpSchema.extend({
  photo: z
    .unknown()
    .refine((value) => getStudentPhotoValidationMessage(value) === null, {
      message: "الصورة لازم تكون 2MB أو أقل وبصيغة JPG/PNG/WEBP.",
    }),
});

export const studentSignUpServerSchema = baseStudentSignUpSchema.extend({
  photo: z.unknown().superRefine((value, context) => {
    const message = getStudentPhotoValidationMessage(value);

    if (message) {
      context.addIssue({
        code: "custom",
        message,
      });
    }
  }),
});

export const profileUpdateSchema = z
  .object({
    fullName: accountNameSchema,
    phone: mobileSchema.or(z.literal("")).optional(),
    teacherSubject: z
      .string()
      .trim()
      .min(2, "اسم المادة مطلوب.")
      .max(80, "اسم المادة طويل.")
      .optional(),
    teacherBio: z
      .string()
      .trim()
      .max(500, "النبذة لا تزيد عن 500 حرف.")
      .optional(),
    studentPhone: mobileSchema.optional(),
    fatherPhone: mobileSchema.optional(),
    schoolName: z.string().trim().min(1, "اسم المدرسة مطلوب.").optional(),
    gender: z
      .string()
      .refine((value) => genderValues.includes(value as never), {
        message: "اختار النوع.",
      })
      .optional(),
    grade: z
      .string()
      .refine((value) => gradeValues.includes(value as never), {
        message: "اختار السنة الدراسية.",
      })
      .optional(),
    section: z
      .string()
      .refine((value) => sectionValues.includes(value as never), {
        message: "اختار الشعبة المناسبة.",
      })
      .optional(),
    photo: z.unknown().optional(),
    cover: z.unknown().optional(),
  })
  .refine(
    (data) =>
      !data.studentPhone ||
      !data.fatherPhone ||
      data.studentPhone !== data.fatherPhone,
    {
      message: "رقم ولي الأمر لازم يكون مختلف عن رقم الطالب.",
      path: ["fatherPhone"],
    },
  )
  .refine(
    (data) =>
      !data.grade ||
      !data.section ||
      sectionsByGrade[data.grade as keyof typeof sectionsByGrade]?.includes(
        data.section as never,
      ),
    {
      message: "الشعبة غير متوافقة مع السنة الدراسية.",
      path: ["section"],
    },
  );
