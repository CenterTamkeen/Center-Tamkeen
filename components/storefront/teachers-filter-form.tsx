type TeachersFilterFormProps = {
  subjects: string[];
  defaultQuery?: string;
  defaultSubject?: string;
  defaultSort?: string;
};

export function TeachersFilterForm({
  subjects,
  defaultQuery,
  defaultSubject,
  defaultSort,
}: TeachersFilterFormProps) {
  return (
    <form
      action="/teachers"
      className="glass-panel-strong animate-fade-up grid gap-4 rounded-xl p-5 md:grid-cols-[1fr_220px_190px_auto]"
    >
      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-bold">
          ابحث عن مدرس أو مادة
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
            placeholder="مثال: كيمياء، محمد، فيزياء"
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
        <span className="text-foreground/80 text-sm font-bold">الترتيب</span>
        <select
          name="sort"
          defaultValue={defaultSort ?? "newest"}
          className="field bg-background/60 py-2.5"
        >
          <option value="newest">الأحدث</option>
          <option value="name">الاسم</option>
        </select>
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          className="btn-primary h-[46px] w-full gap-2 px-6 py-0"
        >
          تطبيق
        </button>
      </div>
    </form>
  );
}
