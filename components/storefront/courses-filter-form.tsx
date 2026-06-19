import type { TeacherSummary } from "@/lib/storefront/data";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

type CoursesFilterFormProps = {
  teachers: TeacherSummary[];
  subjects: string[];
  defaultQuery?: string;
  defaultTeacher?: string;
  defaultSubject?: string;
  defaultGrade?: string;
  defaultSection?: string;
  defaultPriceType?: string;
  defaultMinPrice?: string;
  defaultMaxPrice?: string;
  defaultSort?: string;
};

export function CoursesFilterForm({
  teachers,
  subjects,
  defaultQuery,
  defaultTeacher,
  defaultSubject,
  defaultGrade,
  defaultSection,
  defaultPriceType,
  defaultMinPrice,
  defaultMaxPrice,
  defaultSort,
}: CoursesFilterFormProps) {
  return (
    <form
      action="/courses"
      className="glass-panel-strong animate-fade-up grid gap-4 rounded-xl p-4 sm:p-5 lg:grid-cols-6"
    >
      <label className="space-y-2 lg:col-span-2">
        <span className="text-foreground/80 text-sm font-bold">
          ابحث باسم المادة
        </span>
        <div className="relative">
          <svg
            className="text-foreground/35 absolute top-1/2 right-3 -translate-y-1/2"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            name="q"
            defaultValue={defaultQuery}
            placeholder="مثال: فيزياء، رياضيات، لغة عربية"
            className="field bg-background/60 py-2.5 pr-10"
          />
        </div>
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">المادة</span>
        <select
          name="subject"
          defaultValue={defaultSubject}
          className="field bg-background/60 py-2.5"
        >
          <option value="">كل المواد</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">المدرس</span>
        <select
          name="teacher"
          defaultValue={defaultTeacher}
          className="field bg-background/60 py-2.5"
        >
          <option value="">كل المدرسين</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.profile?.full_name ?? teacher.subject}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">الصف</span>
        <select
          name="grade"
          defaultValue={defaultGrade}
          className="field bg-background/60 py-2.5"
        >
          <option value="">كل الصفوف</option>
          {Object.entries(gradeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">المسار</span>
        <select
          name="section"
          defaultValue={defaultSection}
          className="field bg-background/60 py-2.5"
        >
          <option value="">كل المسارات</option>
          {Object.entries(sectionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">نوع السعر</span>
        <select
          name="priceType"
          defaultValue={defaultPriceType}
          className="field bg-background/60 py-2.5"
        >
          <option value="">الكل</option>
          <option value="free">مجاني</option>
          <option value="paid">مدفوع</option>
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">من سعر</span>
        <input
          name="minPrice"
          type="number"
          min="0"
          step="1"
          defaultValue={defaultMinPrice}
          placeholder="0"
          className="field bg-background/60 py-2.5 text-right"
        />
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">إلى سعر</span>
        <input
          name="maxPrice"
          type="number"
          min="0"
          step="1"
          defaultValue={defaultMaxPrice}
          placeholder="1000"
          className="field bg-background/60 py-2.5 text-right"
        />
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">الترتيب</span>
        <select
          name="sort"
          defaultValue={defaultSort ?? "newest"}
          className="field bg-background/60 py-2.5"
        >
          <option value="newest">الأحدث</option>
          <option value="popular">الأكثر اشتراكًا</option>
          <option value="price_asc">السعر من الأقل</option>
          <option value="price_desc">السعر من الأعلى</option>
        </select>
      </label>

      <div className="flex items-end lg:col-span-2">
        <button
          type="submit"
          className="btn-primary h-[46px] w-full gap-2 px-6 py-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          تطبيق
        </button>
      </div>
    </form>
  );
}
