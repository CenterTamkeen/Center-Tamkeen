import Image from "next/image";
import Link from "next/link";

import { formatPrice, type CourseSummary } from "@/lib/storefront/data";

type CourseCardProps = {
  course: CourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const teacherName = course.teacher?.profile?.full_name ?? "مدرس تمكين";

  return (
    <article className="card-modern gradient-border group flex h-full flex-col">
      {/* Thumbnail */}
      <Link
        href={`/courses/${course.id}`}
        className="relative block aspect-video overflow-hidden"
      >
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="from-primary-50 via-surface to-accent-100 flex h-full items-center justify-center bg-gradient-to-br">
            <span className="text-primary-700 text-lg font-bold">
              {course.teacher?.subject ?? "تمكين"}
            </span>
          </div>
        )}
        {/* Overlay gradient on hover */}
        <div className="from-foreground/20 absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2.5">
          <p className="eyebrow">{course.teacher?.subject ?? "كورس تعليمي"}</p>
          <Link href={`/courses/${course.id}`}>
            <h2 className="group-hover:text-primary-700 line-clamp-2 text-lg leading-7 font-bold transition-colors duration-300">
              {course.title}
            </h2>
          </Link>
          <p className="text-foreground/60 line-clamp-2 text-sm leading-6">
            {course.description ?? "تفاصيل الكورس هتظهر هنا قريبًا."}
          </p>
        </div>

        <div
          className="mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "rgb(208 227 218 / 0.5)" }}
        >
          <div>
            <p className="text-foreground/50 text-xs">المدرس</p>
            {course.teacher?.slug ? (
              <Link
                href={`/teachers/${course.teacher.slug}`}
                className="hover:text-primary-700 text-sm font-semibold transition-colors duration-300"
              >
                {teacherName}
              </Link>
            ) : (
              <p className="text-sm font-semibold">{teacherName}</p>
            )}
          </div>
          <p
            className="rounded-lg px-3 py-1.5 text-base font-black"
            style={{
              background:
                "linear-gradient(135deg, rgb(231 245 241 / 0.9), rgb(197 232 223 / 0.6))",
              color: "var(--primary-700)",
            }}
          >
            {formatPrice(course.price)}
          </p>
        </div>
      </div>
    </article>
  );
}
