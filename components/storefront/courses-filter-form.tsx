import type { TeacherSummary } from "@/lib/storefront/data";

type CoursesFilterFormProps = {
  teachers: TeacherSummary[];
  defaultQuery?: string;
  defaultTeacher?: string;
  defaultSort?: string;
};

export function CoursesFilterForm({
  teachers,
  defaultQuery,
  defaultTeacher,
  defaultSort,
}: CoursesFilterFormProps) {
  return (
    <form
      action="/courses"
      className="glass-panel-strong animate-fade-up grid gap-4 rounded-xl p-5 md:grid-cols-[1fr_220px_190px_auto]"
    >
      <label className="space-y-2">
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
        <span className="text-foreground/80 text-sm font-bold">الترتيب</span>
        <select
          name="sort"
          defaultValue={defaultSort ?? "newest"}
          className="field bg-background/60 py-2.5"
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر من الأقل</option>
          <option value="price_desc">السعر من الأعلى</option>
        </select>
      </label>

      <div className="flex items-end">
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
