import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];

export type ExportDatasetGroup =
  | "students"
  | "content"
  | "finance"
  | "platform";

export const exportDatasetGroupLabels: Record<ExportDatasetGroup, string> = {
  students: "الطلاب والاشتراكات",
  content: "الكورسات والمحتوى",
  finance: "الفلوس والأكواد",
  platform: "بيانات المنصة",
};

export const exportDatasetGroupOrder: ExportDatasetGroup[] = [
  "students",
  "content",
  "finance",
  "platform",
];

type ExportDatasetDefinition = {
  key: string;
  /** Name of the tab inside the workbook. Excel allows 31 characters max. */
  sheetName: string;
  description: string;
  table: TableName;
  group: ExportDatasetGroup;
};

export const exportDatasets = [
  {
    key: "students",
    sheetName: "الطلاب",
    description:
      "الاسم، الإيميل، رقم الطالب، رقم ولي الأمر، المدرسة، السنة، المسار، الكورسات المشترك فيها وإجمالي المدفوع.",
    table: "students",
    group: "students",
  },
  {
    key: "enrollments",
    sheetName: "الاشتراكات",
    description: "كل اشتراك: الطالب والكورس والمدرس وتاريخ الاشتراك.",
    table: "enrollments",
    group: "students",
  },
  {
    key: "lesson_progress",
    sheetName: "متابعة الدروس",
    description: "تقدم كل طالب في كل درس: الحالة، دقايق المشاهدة وعدد المرات.",
    table: "lesson_progress",
    group: "students",
  },
  {
    key: "student_blocks",
    sheetName: "حظر الطلاب",
    description: "الطلاب المحظورين، مين حظرهم والسبب.",
    table: "student_blocks",
    group: "students",
  },
  {
    key: "reviews",
    sheetName: "التقييمات",
    description: "تقييمات الطلاب للكورسات مع التعليقات.",
    table: "reviews",
    group: "students",
  },
  {
    key: "teachers",
    sheetName: "المدرسين",
    description: "بيانات المدرسين، المادة، عدد الكورسات وإجمالي الأرباح.",
    table: "teachers",
    group: "content",
  },
  {
    key: "courses",
    sheetName: "الكورسات",
    description: "الكورسات بالسعر والمدرس وعدد الدروس والمشتركين والإيراد.",
    table: "courses",
    group: "content",
  },
  {
    key: "lessons",
    sheetName: "الدروس",
    description: "دروس كل كورس، مصدر الفيديو والمدة.",
    table: "lessons",
    group: "content",
  },
  {
    key: "lesson_attachments",
    sheetName: "مرفقات الدروس",
    description: "الملفات المرفوعة على الدروس.",
    table: "lesson_attachments",
    group: "content",
  },
  {
    key: "lesson_quiz_questions",
    sheetName: "أسئلة الكويزات",
    description: "أسئلة الكويزات بالاختيارات والإجابة الصحيحة.",
    table: "lesson_quiz_questions",
    group: "content",
  },
  {
    key: "orders",
    sheetName: "الطلبات",
    description: "الطلبات بالحالة والمبلغ والكورسات اللي جواها.",
    table: "orders",
    group: "finance",
  },
  {
    key: "order_items",
    sheetName: "عناصر الطلبات",
    description: "كل كورس داخل كل طلب بسعره وقت الشراء.",
    table: "order_items",
    group: "finance",
  },
  {
    key: "teacher_earnings",
    sheetName: "أرباح المدرسين",
    description: "أرباح كل مدرس مربوطة بالطلبات.",
    table: "teacher_earnings",
    group: "finance",
  },
  {
    key: "coupons",
    sheetName: "الكوبونات",
    description: "الكوبونات بقيمة الخصم وحد الاستخدام وتاريخ الانتهاء.",
    table: "coupons",
    group: "finance",
  },
  {
    key: "coupon_redemptions",
    sheetName: "استخدامات الكوبونات",
    description: "مين استخدم أي كوبون وقيمة الخصم.",
    table: "coupon_redemptions",
    group: "finance",
  },
  {
    key: "coupon_student_targets",
    sheetName: "كوبونات لطلاب",
    description: "الكوبونات المحصورة على طلاب معينين.",
    table: "coupon_student_targets",
    group: "finance",
  },
  {
    key: "activation_codes",
    sheetName: "أكواد التفعيل",
    description: "كل كود، الكورس بتاعه، مين استخدمه وامتى.",
    table: "activation_codes",
    group: "finance",
  },
  {
    key: "activation_code_attempts",
    sheetName: "محاولات الأكواد",
    description: "محاولات إدخال الأكواد الناجحة والفاشلة.",
    table: "activation_code_attempts",
    group: "finance",
  },
  {
    key: "profiles",
    sheetName: "كل الحسابات",
    description: "كل حسابات المنصة (طلاب، مدرسين، أدمن) بالإيميل والصلاحية.",
    table: "profiles",
    group: "platform",
  },
  {
    key: "notifications",
    sheetName: "الإشعارات",
    description: "الإشعارات المتبعتة للمستخدمين وحالة القراءة.",
    table: "notifications",
    group: "platform",
  },
  {
    key: "hero_announcements",
    sheetName: "الإعلانات",
    description: "بانرات الصفحة الرئيسية وحالتها.",
    table: "hero_announcements",
    group: "platform",
  },
] as const satisfies readonly ExportDatasetDefinition[];

export type ExportDataset = (typeof exportDatasets)[number];
export type ExportDatasetKey = ExportDataset["key"];

export const exportDatasetKeys = exportDatasets.map(
  (dataset) => dataset.key,
) as ExportDatasetKey[];

export function isExportDatasetKey(value: string): value is ExportDatasetKey {
  return exportDatasetKeys.includes(value as ExportDatasetKey);
}

export type ExportColumn = { header: string; width: number };
export type ExportCell = string | number;
export type ExportSheetBody = {
  columns: ExportColumn[];
  rows: ExportCell[][];
};

export type ExportSheet = ExportSheetBody & {
  key: ExportDatasetKey;
  name: string;
};

export type ExportDatasetCounts = Record<ExportDatasetKey, number | null>;
