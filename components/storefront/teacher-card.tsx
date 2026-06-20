import Image from "next/image";
import Link from "next/link";

import type { TeacherSummary } from "@/lib/storefront/data";

type TeacherCardProps = {
  teacher: TeacherSummary;
};

export function TeacherCard({ teacher }: TeacherCardProps) {
  const name = teacher.profile?.full_name ?? "مدرس تمكين";
  const avatar = teacher.avatar_url ?? teacher.profile?.avatar_url;
  const studentCount = teacher.stats?.studentCount ?? 0;
  const courseCount = teacher.stats?.publishedCourses ?? 0;

  return (
    <Link
      href={`/teachers/${teacher.slug}`}
      className="card-modern gradient-border group grid h-full gap-4 p-5"
    >
      {/* Decorative accent line */}
      <div
        className="absolute top-0 right-0 h-1 w-16 rounded-bl-full transition-all duration-500 group-hover:w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--accent-400), var(--primary-400))",
        }}
      />

      <div className="flex items-center gap-4">
        <div className="avatar-ring relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-105">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div
              className="text-primary-foreground flex h-full items-center justify-center text-xl font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
              }}
            >
              {name.slice(0, 1)}
            </div>
          )}
        </div>

        <div>
          <h2 className="group-hover:text-primary-700 text-lg font-bold transition-colors duration-300">
            {name}
          </h2>
          <p className="eyebrow mt-0.5 text-xs">{teacher.subject}</p>
        </div>
      </div>

      <p className="text-foreground/60 line-clamp-3 text-sm leading-7">
        {teacher.bio ?? "نبذة المدرس هتظهر هنا قريبًا مع كورساته المتاحة."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-border/70 bg-surface-muted/55 rounded-xl border px-3 py-2">
          <p className="text-foreground/50 text-xs font-bold">الطلاب</p>
          <p className="text-primary-700 mt-1 text-base font-black">
            {studentCount.toLocaleString("ar-EG")}
          </p>
        </div>
        <div className="border-border/70 bg-surface-muted/55 rounded-xl border px-3 py-2">
          <p className="text-foreground/50 text-xs font-bold">الكورسات</p>
          <p className="text-accent-700 mt-1 text-base font-black">
            {courseCount.toLocaleString("ar-EG")}
          </p>
        </div>
      </div>
      {/* Arrow indicator */}
      <div className="text-primary-600 flex items-center gap-1 text-xs font-bold opacity-0 transition-all duration-300 group-hover:translate-x-[-4px] group-hover:opacity-100">
        <span>عرض الكورسات</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </div>
    </Link>
  );
}
