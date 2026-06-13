import Image from "next/image";
import Link from "next/link";

import { formatPrice, type CourseSummary } from "@/lib/storefront/data";

type CourseCardProps = {
  course: CourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const teacherName = course.teacher?.profile?.full_name ?? "مدرس تمكين";

  return (
    <article className="border-border bg-surface flex h-full flex-col overflow-hidden rounded-md border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/courses/${course.id}`}
        className="relative block aspect-video"
      >
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="from-primary-50 to-accent-100 flex h-full items-center justify-center bg-linear-to-br">
            <span className="text-primary-700 text-lg font-bold">
              {course.teacher?.subject ?? "تمكين"}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <p className="text-primary-700 text-sm font-bold">
            {course.teacher?.subject ?? "كورس تعليمي"}
          </p>
          <Link href={`/courses/${course.id}`}>
            <h2 className="line-clamp-2 text-lg leading-7 font-bold">
              {course.title}
            </h2>
          </Link>
          <p className="text-foreground/65 line-clamp-2 text-sm leading-6">
            {course.description ?? "تفاصيل الكورس هتظهر هنا قريبًا."}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-foreground/55 text-xs">المدرس</p>
            {course.teacher?.slug ? (
              <Link
                href={`/teachers/${course.teacher.slug}`}
                className="hover:text-primary-700 text-sm font-semibold"
              >
                {teacherName}
              </Link>
            ) : (
              <p className="text-sm font-semibold">{teacherName}</p>
            )}
          </div>
          <p className="text-primary-700 text-base font-bold">
            {formatPrice(course.price)}
          </p>
        </div>
      </div>
    </article>
  );
}
