import {
  exportDatasets,
  type ExportDatasetCounts,
  type ExportDatasetKey,
  type ExportSheet,
  type ExportSheetBody,
} from "@/lib/admin/export-datasets";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;
type TableRow<T extends TableName> = Tables[T]["Row"];

/** PostgREST caps a single response at 1000 rows, so every table is paged. */
const PAGE_SIZE = 1000;

/**
 * Sorting each page by a unique tie-breaker keeps pagination stable when many
 * rows share the same timestamp.
 */
const tableOrderColumns: Record<TableName, string[]> = {
  profiles: ["created_at", "id"],
  students: ["created_at", "id"],
  teachers: ["created_at", "id"],
  courses: ["created_at", "id"],
  lessons: ["course_id", "order_index"],
  orders: ["created_at", "id"],
  order_items: ["created_at", "id"],
  enrollments: ["enrolled_at", "id"],
  coupons: ["created_at", "id"],
  coupon_student_targets: ["created_at", "coupon_id", "student_id"],
  coupon_redemptions: ["redeemed_at", "id"],
  lesson_progress: ["created_at", "id"],
  lesson_attachments: ["created_at", "id"],
  lesson_quiz_questions: ["lesson_id", "order_index"],
  reviews: ["created_at", "id"],
  teacher_earnings: ["created_at", "id"],
  student_blocks: ["created_at", "id"],
  activation_codes: ["created_at", "id"],
  activation_code_attempts: ["attempted_at", "id"],
  notifications: ["created_at", "id"],
  hero_announcements: ["created_at", "id"],
  email_verification_codes: ["created_at", "id"],
};

/** Tables a dataset needs on top of the always-loaded reference tables. */
const datasetExtraTables: Record<ExportDatasetKey, TableName[]> = {
  students: ["enrollments", "student_blocks"],
  enrollments: ["enrollments"],
  lesson_progress: ["lesson_progress", "lessons"],
  student_blocks: ["student_blocks"],
  reviews: ["reviews"],
  teachers: ["teacher_earnings"],
  courses: ["enrollments", "lessons", "order_items"],
  lessons: ["lessons"],
  lesson_attachments: ["lesson_attachments", "lessons"],
  lesson_quiz_questions: ["lesson_quiz_questions", "lessons"],
  orders: ["order_items"],
  order_items: ["order_items"],
  teacher_earnings: ["teacher_earnings"],
  coupons: [],
  coupon_redemptions: ["coupon_redemptions"],
  coupon_student_targets: ["coupon_student_targets"],
  activation_codes: ["activation_codes"],
  activation_code_attempts: ["activation_code_attempts"],
  profiles: [],
  notifications: ["notifications"],
  hero_announcements: ["hero_announcements"],
};

/** Loaded for every export so foreign keys can be rendered as readable names. */
const referenceTables: TableName[] = [
  "profiles",
  "students",
  "teachers",
  "courses",
  "orders",
  "coupons",
];

function logExportError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin:export:${label}]`, error);
  }
}

type LoosePostgrestResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type LooseOrderableQuery = {
  order: (
    column: string,
    options: { ascending: boolean },
  ) => LooseOrderableQuery;
  range: (from: number, to: number) => PromiseLike<LoosePostgrestResult>;
};

type LooseTableQuery = {
  select: (columns: string) => LooseOrderableQuery;
};

/**
 * The Supabase client can't infer types when the table name is generic, so the
 * query is built through a loose shape and cast back at the boundary.
 */
async function fetchTable<T extends TableName>(
  table: T,
): Promise<TableRow<T>[]> {
  const admin = createAdminClient();
  const rows: TableRow<T>[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = (admin.from(table) as unknown as LooseTableQuery).select("*");

    for (const column of tableOrderColumns[table]) {
      query = query.order(column, { ascending: true });
    }

    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logExportError(table, error.message);
      break;
    }

    const page = (data ?? []) as TableRow<T>[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

/** Emails live in auth.users, which sits outside the public schema. */
async function fetchAuthEmails() {
  const emailByProfileId = new Map<string, string>();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return emailByProfileId;
  }

  try {
    const admin = createAdminClient();

    for (let page = 1; ; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });

      if (error) {
        logExportError("auth-emails", error.message);
        break;
      }

      for (const user of data.users) {
        if (user.email) {
          emailByProfileId.set(user.id, user.email);
        }
      }

      if (data.users.length < PAGE_SIZE) {
        break;
      }
    }
  } catch (error) {
    logExportError("auth-emails", error);
  }

  return emailByProfileId;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = dateTimeFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

function formatBoolean(value: boolean | null | undefined) {
  return value ? "نعم" : "لا";
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMinutes(seconds: number | null | undefined) {
  return Math.round(toNumber(seconds) / 60);
}

const roleLabels: Record<Database["public"]["Enums"]["app_role"], string> = {
  student: "طالب",
  teacher: "مدرس",
  admin: "أدمن",
};

const genderLabels: Record<
  Database["public"]["Enums"]["student_gender"],
  string
> = {
  male: "ذكر",
  female: "أنثى",
};

const orderStatusLabels: Record<
  Database["public"]["Enums"]["order_status"],
  string
> = {
  pending: "قيد المراجعة",
  completed: "مكتمل",
  rejected: "مرفوض",
};

const discountTypeLabels: Record<
  Database["public"]["Enums"]["discount_type"],
  string
> = {
  percentage: "نسبة مئوية",
  fixed: "مبلغ ثابت",
};

const progressStatusLabels: Record<string, string> = {
  in_progress: "بيتفرج",
  completed: "خلص",
};

/** Rows created before the section list changed can still hold these values. */
const legacySectionLabels: Record<string, string> = {
  general: "عام",
  scientific: "علمي",
  literary: "أدبي",
  science: "علوم",
  mathematics: "رياضة",
};

function getGradeLabel(grade: string | null | undefined) {
  if (!grade) {
    return "";
  }

  return gradeLabels[grade as keyof typeof gradeLabels] ?? grade;
}

function getSectionLabel(section: string | null | undefined) {
  if (!section) {
    return "";
  }

  return (
    sectionLabels[section as keyof typeof sectionLabels] ??
    legacySectionLabels[section] ??
    section
  );
}

type LoadedTables = {
  [T in TableName]?: TableRow<T>[];
};

function collectTables(keys: ExportDatasetKey[]) {
  const tables = new Set<TableName>(referenceTables);

  for (const key of keys) {
    for (const table of datasetExtraTables[key]) {
      tables.add(table);
    }
  }

  return [...tables];
}

async function loadTables(tables: TableName[]) {
  const entries = await Promise.all(
    tables.map(
      async (table) => [table, await fetchTable(table)] as [TableName, never[]],
    ),
  );

  return Object.fromEntries(entries) as LoadedTables;
}

function indexById<T extends { id: string }>(rows: T[] | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

function groupBy<T>(rows: T[] | undefined, getKey: (row: T) => string | null) {
  const grouped = new Map<string, T[]>();

  for (const row of rows ?? []) {
    const key = getKey(row);

    if (!key) {
      continue;
    }

    const current = grouped.get(key);

    if (current) {
      current.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  return grouped;
}

export async function getExportDatasetCounts(): Promise<ExportDatasetCounts> {
  const admin = createAdminClient();

  const entries = await Promise.all(
    exportDatasets.map(async (dataset) => {
      const { count, error } = await admin
        .from(dataset.table)
        .select("*", { count: "exact", head: true });

      if (error) {
        logExportError(`count:${dataset.table}`, error.message);
        return [dataset.key, null] as const;
      }

      return [dataset.key, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(entries) as ExportDatasetCounts;
}

export async function buildExportSheets(
  keys: ExportDatasetKey[],
): Promise<ExportSheet[]> {
  const [tables, emailByProfileId] = await Promise.all([
    loadTables(collectTables(keys)),
    fetchAuthEmails(),
  ]);

  const profileById = indexById(tables.profiles);
  const studentById = indexById(tables.students);
  const teacherById = indexById(tables.teachers);
  const courseById = indexById(tables.courses);
  const lessonById = indexById(tables.lessons);
  const orderById = indexById(tables.orders);
  const couponById = indexById(tables.coupons);

  const profileName = (profileId: string | null | undefined) =>
    (profileId && profileById.get(profileId)?.full_name) || "";

  const profileEmail = (profileId: string | null | undefined) =>
    (profileId && emailByProfileId.get(profileId)) || "";

  const studentName = (studentId: string | null | undefined) => {
    const student = studentId ? studentById.get(studentId) : undefined;
    return student ? profileName(student.profile_id) : "";
  };

  const studentPhone = (studentId: string | null | undefined) =>
    (studentId && studentById.get(studentId)?.student_phone) || "";

  const teacherName = (teacherId: string | null | undefined) => {
    const teacher = teacherId ? teacherById.get(teacherId) : undefined;
    return teacher ? profileName(teacher.profile_id) : "";
  };

  const courseTitle = (courseId: string | null | undefined) =>
    (courseId && courseById.get(courseId)?.title) || "";

  const courseTeacherName = (courseId: string | null | undefined) => {
    const course = courseId ? courseById.get(courseId) : undefined;
    return course ? teacherName(course.teacher_id) : "";
  };

  const orderStatusLabel = (orderId: string | null | undefined) => {
    const order = orderId ? orderById.get(orderId) : undefined;
    return order ? (orderStatusLabels[order.status] ?? order.status) : "";
  };

  const builders: Record<ExportDatasetKey, () => ExportSheetBody> = {
    students: () => {
      const enrollmentsByStudent = groupBy(
        tables.enrollments,
        (row) => row.student_id,
      );
      const ordersByStudent = groupBy(tables.orders, (row) => row.student_id);
      const platformBlocksByStudent = groupBy(
        (tables.student_blocks ?? []).filter((row) => !row.teacher_id),
        (row) => row.student_id,
      );

      return {
        columns: [
          { header: "الاسم الكامل", width: 28 },
          { header: "الإيميل", width: 30 },
          { header: "رقم الطالب", width: 15 },
          { header: "رقم ولي الأمر", width: 15 },
          { header: "رقم الحساب", width: 15 },
          { header: "المدرسة", width: 26 },
          { header: "النوع", width: 9 },
          { header: "السنة الدراسية", width: 14 },
          { header: "المسار", width: 26 },
          { header: "الحالة", width: 10 },
          { header: "سبب الحظر", width: 24 },
          { header: "عدد الكورسات", width: 12 },
          { header: "الكورسات المشترك فيها", width: 48 },
          { header: "المدرسين", width: 32 },
          { header: "عدد الطلبات", width: 11 },
          { header: "إجمالي المدفوع", width: 14 },
          { header: "تاريخ التسجيل", width: 18 },
          { header: "آخر تحديث", width: 18 },
          { header: "رابط الصورة", width: 34 },
          { header: "معرّف الطالب", width: 38 },
          { header: "معرّف الحساب", width: 38 },
        ],
        rows: (tables.students ?? []).map((student) => {
          const studentEnrollments = enrollmentsByStudent.get(student.id) ?? [];
          const studentOrders = ordersByStudent.get(student.id) ?? [];
          const block = platformBlocksByStudent.get(student.id)?.[0];
          const teacherNames = [
            ...new Set(
              studentEnrollments
                .map((enrollment) => courseTeacherName(enrollment.course_id))
                .filter(Boolean),
            ),
          ];
          const totalPaid = studentOrders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + toNumber(order.total_amount), 0);

          return [
            profileName(student.profile_id),
            profileEmail(student.profile_id),
            student.student_phone,
            student.father_phone,
            profileById.get(student.profile_id)?.phone ?? "",
            student.school_name,
            genderLabels[student.gender] ?? student.gender,
            getGradeLabel(student.grade),
            getSectionLabel(student.section),
            block ? "محظور" : "نشط",
            block?.reason ?? "",
            studentEnrollments.length,
            studentEnrollments
              .map((enrollment) => courseTitle(enrollment.course_id))
              .join(" | "),
            teacherNames.join(" | "),
            studentOrders.length,
            totalPaid,
            formatDateTime(student.created_at),
            formatDateTime(student.updated_at),
            student.photo_url ??
              profileById.get(student.profile_id)?.avatar_url ??
              "",
            student.id,
            student.profile_id,
          ];
        }),
      };
    },

    enrollments: () => ({
      columns: [
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "الكورس", width: 34 },
        { header: "المادة", width: 18 },
        { header: "المدرس", width: 24 },
        { header: "سعر الكورس", width: 12 },
        { header: "تاريخ الاشتراك", width: 18 },
        { header: "حالة الطلب", width: 13 },
        { header: "معرّف الاشتراك", width: 38 },
        { header: "معرّف الطلب", width: 38 },
      ],
      rows: (tables.enrollments ?? []).map((enrollment) => {
        const course = courseById.get(enrollment.course_id);

        return [
          studentName(enrollment.student_id),
          studentPhone(enrollment.student_id),
          course?.title ?? "",
          course?.subject ?? "",
          courseTeacherName(enrollment.course_id),
          toNumber(course?.price),
          formatDateTime(enrollment.enrolled_at),
          orderStatusLabel(enrollment.order_id),
          enrollment.id,
          enrollment.order_id,
        ];
      }),
    }),

    lesson_progress: () => ({
      columns: [
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "الكورس", width: 34 },
        { header: "الدرس", width: 34 },
        { header: "الحالة", width: 11 },
        { header: "دقايق المشاهدة", width: 14 },
        { header: "عدد مرات التشغيل", width: 15 },
        { header: "أول مشاهدة", width: 18 },
        { header: "آخر مشاهدة", width: 18 },
        { header: "تاريخ الإكمال", width: 18 },
      ],
      rows: (tables.lesson_progress ?? []).map((progress) => [
        studentName(progress.student_id),
        studentPhone(progress.student_id),
        courseTitle(progress.course_id),
        lessonById.get(progress.lesson_id)?.title ?? "",
        progressStatusLabels[progress.status] ?? progress.status,
        toMinutes(progress.watched_seconds),
        toNumber(progress.playback_count),
        formatDateTime(progress.started_at),
        formatDateTime(progress.last_watched_at),
        formatDateTime(progress.completed_at),
      ]),
    }),

    student_blocks: () => ({
      columns: [
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "نطاق الحظر", width: 26 },
        { header: "مين حظره", width: 24 },
        { header: "السبب", width: 40 },
        { header: "تاريخ الحظر", width: 18 },
      ],
      rows: (tables.student_blocks ?? []).map((block) => [
        studentName(block.student_id),
        studentPhone(block.student_id),
        block.teacher_id
          ? `مدرس: ${teacherName(block.teacher_id)}`
          : "المنصة بالكامل",
        profileName(block.blocked_by),
        block.reason ?? "",
        formatDateTime(block.created_at),
      ]),
    }),

    reviews: () => ({
      columns: [
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "الكورس", width: 34 },
        { header: "المدرس", width: 24 },
        { header: "التقييم", width: 9 },
        { header: "التعليق", width: 50 },
        { header: "تاريخ التقييم", width: 18 },
      ],
      rows: (tables.reviews ?? []).map((review) => [
        studentName(review.student_id),
        studentPhone(review.student_id),
        courseTitle(review.course_id),
        courseTeacherName(review.course_id),
        toNumber(review.rating),
        review.comment ?? "",
        formatDateTime(review.created_at),
      ]),
    }),

    teachers: () => {
      const coursesByTeacher = groupBy(tables.courses, (row) => row.teacher_id);
      const earningsByTeacher = groupBy(
        tables.teacher_earnings,
        (row) => row.teacher_id,
      );

      return {
        columns: [
          { header: "الاسم", width: 28 },
          { header: "الإيميل", width: 30 },
          { header: "الموبايل", width: 15 },
          { header: "المادة", width: 20 },
          { header: "الرابط", width: 24 },
          { header: "نشط", width: 8 },
          { header: "عدد الكورسات", width: 12 },
          { header: "إجمالي الأرباح", width: 14 },
          { header: "نبذة", width: 50 },
          { header: "تاريخ الإضافة", width: 18 },
          { header: "معرّف المدرس", width: 38 },
        ],
        rows: (tables.teachers ?? []).map((teacher) => [
          profileName(teacher.profile_id),
          profileEmail(teacher.profile_id),
          profileById.get(teacher.profile_id)?.phone ?? "",
          teacher.subject,
          teacher.slug,
          formatBoolean(teacher.is_active),
          (coursesByTeacher.get(teacher.id) ?? []).length,
          (earningsByTeacher.get(teacher.id) ?? []).reduce(
            (sum, earning) => sum + toNumber(earning.amount),
            0,
          ),
          teacher.bio ?? "",
          formatDateTime(teacher.created_at),
          teacher.id,
        ]),
      };
    },

    courses: () => {
      const lessonsByCourse = groupBy(tables.lessons, (row) => row.course_id);
      const enrollmentsByCourse = groupBy(
        tables.enrollments,
        (row) => row.course_id,
      );
      const itemsByCourse = groupBy(tables.order_items, (row) => row.course_id);

      return {
        columns: [
          { header: "الكورس", width: 34 },
          { header: "المدرس", width: 24 },
          { header: "المادة", width: 18 },
          { header: "السعر", width: 10 },
          { header: "السنة المستهدفة", width: 14 },
          { header: "المسار المستهدف", width: 26 },
          { header: "منشور", width: 9 },
          { header: "عدد الدروس", width: 11 },
          { header: "عدد المشتركين", width: 12 },
          { header: "إجمالي الإيراد", width: 14 },
          { header: "الوصف", width: 50 },
          { header: "تاريخ الإنشاء", width: 18 },
          { header: "معرّف الكورس", width: 38 },
        ],
        rows: (tables.courses ?? []).map((course) => {
          const revenue = (itemsByCourse.get(course.id) ?? []).reduce(
            (sum, item) =>
              orderById.get(item.order_id)?.status === "completed"
                ? sum + toNumber(item.price_at_purchase)
                : sum,
            0,
          );

          return [
            course.title,
            teacherName(course.teacher_id),
            course.subject ?? "",
            toNumber(course.price),
            getGradeLabel(course.target_grade),
            getSectionLabel(course.target_section),
            formatBoolean(course.is_published),
            (lessonsByCourse.get(course.id) ?? []).length,
            (enrollmentsByCourse.get(course.id) ?? []).length,
            revenue,
            course.description ?? "",
            formatDateTime(course.created_at),
            course.id,
          ];
        }),
      };
    },

    lessons: () => ({
      columns: [
        { header: "الكورس", width: 34 },
        { header: "المدرس", width: 24 },
        { header: "ترتيب الدرس", width: 11 },
        { header: "الدرس", width: 34 },
        { header: "مصدر الفيديو", width: 13 },
        { header: "معرّف الفيديو", width: 34 },
        { header: "المدة بالدقايق", width: 13 },
        { header: "معاينة مجانية", width: 13 },
        { header: "تاريخ الإضافة", width: 18 },
        { header: "معرّف الدرس", width: 38 },
      ],
      rows: (tables.lessons ?? []).map((lesson) => [
        courseTitle(lesson.course_id),
        courseTeacherName(lesson.course_id),
        toNumber(lesson.order_index),
        lesson.title,
        lesson.video_provider,
        lesson.bunny_video_id ??
          lesson.vdocipher_video_id ??
          lesson.youtube_video_id ??
          lesson.youtube_url ??
          "",
        toMinutes(lesson.duration),
        formatBoolean(lesson.is_free_preview),
        formatDateTime(lesson.created_at),
        lesson.id,
      ]),
    }),

    lesson_attachments: () => ({
      columns: [
        { header: "الكورس", width: 34 },
        { header: "الدرس", width: 34 },
        { header: "اسم الملف", width: 30 },
        { header: "نوع الملف", width: 14 },
        { header: "الحجم (كيلوبايت)", width: 15 },
        { header: "الرابط", width: 46 },
        { header: "تاريخ الإضافة", width: 18 },
      ],
      rows: (tables.lesson_attachments ?? []).map((attachment) => {
        const lesson = lessonById.get(attachment.lesson_id);

        return [
          courseTitle(lesson?.course_id),
          lesson?.title ?? "",
          attachment.title,
          attachment.file_type ?? "",
          Math.round(toNumber(attachment.file_size) / 1024),
          attachment.file_url,
          formatDateTime(attachment.created_at),
        ];
      }),
    }),

    lesson_quiz_questions: () => ({
      columns: [
        { header: "الكورس", width: 34 },
        { header: "الدرس", width: 34 },
        { header: "ترتيب السؤال", width: 12 },
        { header: "السؤال", width: 50 },
        { header: "الاختيار 1", width: 24 },
        { header: "الاختيار 2", width: 24 },
        { header: "الاختيار 3", width: 24 },
        { header: "الاختيار 4", width: 24 },
        { header: "الإجابة الصحيحة", width: 24 },
      ],
      rows: (tables.lesson_quiz_questions ?? []).map((question) => {
        const lesson = lessonById.get(question.lesson_id);
        const options = Array.isArray(question.options)
          ? question.options.map((option) => String(option ?? ""))
          : [];

        return [
          courseTitle(lesson?.course_id),
          lesson?.title ?? "",
          toNumber(question.order_index),
          question.question,
          options[0] ?? "",
          options[1] ?? "",
          options[2] ?? "",
          options[3] ?? "",
          options[question.correct_option_index] ?? "",
        ];
      }),
    }),

    orders: () => {
      const itemsByOrder = groupBy(tables.order_items, (row) => row.order_id);

      return {
        columns: [
          { header: "الطالب", width: 28 },
          { header: "رقم الطالب", width: 15 },
          { header: "المبلغ", width: 11 },
          { header: "الحالة", width: 13 },
          { header: "الكورسات", width: 48 },
          { header: "رقم فوري", width: 18 },
          { header: "سبب الرفض", width: 30 },
          { header: "تاريخ الطلب", width: 18 },
          { header: "تاريخ الإكمال", width: 18 },
          { header: "معرّف الطلب", width: 38 },
        ],
        rows: (tables.orders ?? []).map((order) => [
          studentName(order.student_id),
          studentPhone(order.student_id),
          toNumber(order.total_amount),
          orderStatusLabels[order.status] ?? order.status,
          (itemsByOrder.get(order.id) ?? [])
            .map((item) => courseTitle(item.course_id))
            .join(" | "),
          order.fawry_ref_no ?? "",
          order.rejection_reason ?? "",
          formatDateTime(order.created_at),
          formatDateTime(order.completed_at),
          order.id,
        ]),
      };
    },

    order_items: () => ({
      columns: [
        { header: "الطالب", width: 28 },
        { header: "الكورس", width: 34 },
        { header: "المدرس", width: 24 },
        { header: "السعر وقت الشراء", width: 15 },
        { header: "حالة الطلب", width: 13 },
        { header: "تاريخ الإضافة", width: 18 },
        { header: "معرّف الطلب", width: 38 },
      ],
      rows: (tables.order_items ?? []).map((item) => [
        studentName(orderById.get(item.order_id)?.student_id),
        courseTitle(item.course_id),
        courseTeacherName(item.course_id),
        toNumber(item.price_at_purchase),
        orderStatusLabel(item.order_id),
        formatDateTime(item.created_at),
        item.order_id,
      ]),
    }),

    teacher_earnings: () => ({
      columns: [
        { header: "المدرس", width: 28 },
        { header: "المادة", width: 18 },
        { header: "المبلغ", width: 11 },
        { header: "الطالب", width: 28 },
        { header: "حالة الطلب", width: 13 },
        { header: "التاريخ", width: 18 },
        { header: "معرّف الطلب", width: 38 },
      ],
      rows: (tables.teacher_earnings ?? []).map((earning) => [
        teacherName(earning.teacher_id),
        teacherById.get(earning.teacher_id)?.subject ?? "",
        toNumber(earning.amount),
        studentName(orderById.get(earning.order_id)?.student_id),
        orderStatusLabel(earning.order_id),
        formatDateTime(earning.created_at),
        earning.order_id,
      ]),
    }),

    coupons: () => ({
      columns: [
        { header: "الكود", width: 18 },
        { header: "المدرس", width: 24 },
        { header: "الكورس", width: 34 },
        { header: "نوع الخصم", width: 13 },
        { header: "قيمة الخصم", width: 11 },
        { header: "حد الاستخدام", width: 12 },
        { header: "مرات الاستخدام", width: 13 },
        { header: "مخصص لطالب", width: 24 },
        { header: "نشط", width: 8 },
        { header: "تاريخ الانتهاء", width: 18 },
        { header: "تاريخ الإنشاء", width: 18 },
      ],
      rows: (tables.coupons ?? []).map((coupon) => [
        coupon.code,
        teacherName(coupon.teacher_id),
        coupon.course_id ? courseTitle(coupon.course_id) : "كل الكورسات",
        discountTypeLabels[coupon.discount_type] ?? coupon.discount_type,
        toNumber(coupon.discount_value),
        coupon.usage_limit === null ? "بلا حدود" : toNumber(coupon.usage_limit),
        toNumber(coupon.used_count),
        studentName(coupon.target_student_id),
        formatBoolean(coupon.is_active),
        formatDateTime(coupon.expires_at),
        formatDateTime(coupon.created_at),
      ]),
    }),

    coupon_redemptions: () => ({
      columns: [
        { header: "الكود", width: 18 },
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "قيمة الخصم", width: 12 },
        { header: "حالة الطلب", width: 13 },
        { header: "تاريخ الاستخدام", width: 18 },
        { header: "معرّف الطلب", width: 38 },
      ],
      rows: (tables.coupon_redemptions ?? []).map((redemption) => [
        couponById.get(redemption.coupon_id)?.code ?? "",
        studentName(redemption.student_id),
        studentPhone(redemption.student_id),
        toNumber(redemption.discount_amount),
        orderStatusLabel(redemption.order_id),
        formatDateTime(redemption.redeemed_at),
        redemption.order_id ?? "",
      ]),
    }),

    coupon_student_targets: () => ({
      columns: [
        { header: "الكود", width: 18 },
        { header: "المدرس", width: 24 },
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "تاريخ التخصيص", width: 18 },
      ],
      rows: (tables.coupon_student_targets ?? []).map((target) => {
        const coupon = couponById.get(target.coupon_id);

        return [
          coupon?.code ?? "",
          teacherName(coupon?.teacher_id),
          studentName(target.student_id),
          studentPhone(target.student_id),
          formatDateTime(target.created_at),
        ];
      }),
    }),

    activation_codes: () => ({
      columns: [
        { header: "الكود", width: 12 },
        { header: "الكورس", width: 34 },
        { header: "المدرس", width: 24 },
        { header: "الحالة", width: 13 },
        { header: "استخدمه", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "تاريخ الاستخدام", width: 18 },
        { header: "تاريخ الانتهاء", width: 18 },
        { header: "أنشأه", width: 24 },
        { header: "تاريخ الإنشاء", width: 18 },
      ],
      rows: (tables.activation_codes ?? []).map((code) => {
        const expired =
          !code.used_at && new Date(code.expires_at).getTime() < Date.now();

        return [
          code.code,
          courseTitle(code.course_id),
          courseTeacherName(code.course_id),
          code.used_at ? "مستخدم" : expired ? "منتهي" : "متاح",
          studentName(code.used_by_student_id),
          studentPhone(code.used_by_student_id),
          formatDateTime(code.used_at),
          formatDateTime(code.expires_at),
          profileName(code.created_by_profile_id),
          formatDateTime(code.created_at),
        ];
      }),
    }),

    activation_code_attempts: () => ({
      columns: [
        { header: "الطالب", width: 28 },
        { header: "رقم الطالب", width: 15 },
        { header: "الكورس", width: 34 },
        { header: "الكود المدخل", width: 13 },
        { header: "نجحت", width: 8 },
        { header: "تاريخ المحاولة", width: 18 },
      ],
      rows: (tables.activation_code_attempts ?? []).map((attempt) => [
        studentName(attempt.student_id),
        studentPhone(attempt.student_id),
        courseTitle(attempt.course_id),
        attempt.submitted_code,
        formatBoolean(attempt.success),
        formatDateTime(attempt.attempted_at),
      ]),
    }),

    profiles: () => {
      const studentByProfile = new Map(
        (tables.students ?? []).map((student) => [student.profile_id, student]),
      );
      const teacherByProfile = new Map(
        (tables.teachers ?? []).map((teacher) => [teacher.profile_id, teacher]),
      );

      return {
        columns: [
          { header: "الاسم", width: 28 },
          { header: "الإيميل", width: 30 },
          { header: "الصلاحية", width: 10 },
          { header: "الموبايل", width: 15 },
          { header: "رقم الطالب", width: 15 },
          { header: "رقم ولي الأمر", width: 15 },
          { header: "مادة المدرس", width: 18 },
          { header: "تاريخ التسجيل", width: 18 },
          { header: "آخر تحديث", width: 18 },
          { header: "معرّف الحساب", width: 38 },
        ],
        rows: (tables.profiles ?? []).map((profile) => {
          const student = studentByProfile.get(profile.id);

          return [
            profile.full_name,
            profileEmail(profile.id),
            roleLabels[profile.role] ?? profile.role,
            profile.phone ?? "",
            student?.student_phone ?? "",
            student?.father_phone ?? "",
            teacherByProfile.get(profile.id)?.subject ?? "",
            formatDateTime(profile.created_at),
            formatDateTime(profile.updated_at),
            profile.id,
          ];
        }),
      };
    },

    notifications: () => ({
      columns: [
        { header: "المستلم", width: 28 },
        { header: "إيميل المستلم", width: 30 },
        { header: "المرسل", width: 24 },
        { header: "النوع", width: 12 },
        { header: "العنوان", width: 34 },
        { header: "النص", width: 50 },
        { header: "الكورس", width: 34 },
        { header: "الرابط", width: 30 },
        { header: "اتقرأ", width: 8 },
        { header: "تاريخ القراءة", width: 18 },
        { header: "تاريخ الإرسال", width: 18 },
      ],
      rows: (tables.notifications ?? []).map((notification) => [
        profileName(notification.recipient_profile_id),
        profileEmail(notification.recipient_profile_id),
        profileName(notification.actor_profile_id),
        notification.kind,
        notification.title,
        notification.body,
        courseTitle(notification.course_id),
        notification.href ?? "",
        formatBoolean(Boolean(notification.read_at)),
        formatDateTime(notification.read_at),
        formatDateTime(notification.created_at),
      ]),
    }),

    hero_announcements: () => ({
      columns: [
        { header: "العنوان", width: 34 },
        { header: "صاحب الإعلان", width: 12 },
        { header: "المدرس", width: 24 },
        { header: "أنشأه", width: 24 },
        { header: "نص الزر", width: 20 },
        { header: "رابط الزر", width: 34 },
        { header: "رابط الصورة", width: 40 },
        { header: "نشط", width: 8 },
        { header: "تاريخ الإنشاء", width: 18 },
      ],
      rows: (tables.hero_announcements ?? []).map((announcement) => [
        announcement.title,
        roleLabels[announcement.owner_role] ?? announcement.owner_role,
        teacherName(announcement.teacher_id),
        profileName(announcement.created_by),
        announcement.button_text,
        announcement.button_url,
        announcement.image_url,
        formatBoolean(announcement.is_active),
        formatDateTime(announcement.created_at),
      ]),
    }),
  };

  // Registry order keeps the workbook tabs consistent between exports.
  return exportDatasets
    .filter((dataset) => keys.includes(dataset.key))
    .map((dataset) => ({
      key: dataset.key,
      name: dataset.sheetName,
      ...builders[dataset.key](),
    }));
}
