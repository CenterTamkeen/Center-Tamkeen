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
      className="glass-panel grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_220px_190px_auto]"
    >
      <label className="space-y-2">
        <span className="text-sm font-bold">ابحث باسم المادة</span>
        <input
          name="q"
          defaultValue={defaultQuery}
          placeholder="مثال: فيزياء، رياضيات، لغة عربية"
          className="field bg-background py-2.5"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-bold">المدرس</span>
        <select
          name="teacher"
          defaultValue={defaultTeacher}
          className="field bg-background py-2.5"
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
        <span className="text-sm font-bold">الترتيب</span>
        <select
          name="sort"
          defaultValue={defaultSort ?? "newest"}
          className="field bg-background py-2.5"
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر من الأقل</option>
          <option value="price_desc">السعر من الأعلى</option>
        </select>
      </label>

      <div className="flex items-end">
        <button type="submit" className="btn-primary h-11 w-full px-5 py-0">
          تطبيق
        </button>
      </div>
    </form>
  );
}
