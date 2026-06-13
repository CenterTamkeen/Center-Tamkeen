import Image from "next/image";
import Link from "next/link";

import type { TeacherSummary } from "@/lib/storefront/data";

type TeacherCardProps = {
  teacher: TeacherSummary;
};

export function TeacherCard({ teacher }: TeacherCardProps) {
  const name = teacher.profile?.full_name ?? "مدرس تمكين";
  const avatar = teacher.avatar_url ?? teacher.profile?.avatar_url;

  return (
    <Link
      href={`/teachers/${teacher.slug}`}
      className="border-border bg-surface grid h-full gap-4 rounded-md border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="border-primary-100 bg-primary-50 relative h-16 w-16 overflow-hidden rounded-md border">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="text-primary-700 flex h-full items-center justify-center text-xl font-bold">
              {name.slice(0, 1)}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          <p className="text-primary-700 text-sm font-semibold">
            {teacher.subject}
          </p>
        </div>
      </div>

      <p className="text-foreground/65 line-clamp-3 text-sm leading-7">
        {teacher.bio ?? "نبذة المدرس هتظهر هنا قريبًا مع كورساته المتاحة."}
      </p>
    </Link>
  );
}
