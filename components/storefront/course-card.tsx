import Image from "next/image";
import Link from "next/link";

import { formatPrice, type CourseSummary } from "@/lib/storefront/data";
import { buildCourseHref } from "@/lib/storefront/links";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

type CourseCardProps = {
  course: CourseSummary;
  isEnrolled?: boolean;
};

export function CourseCard({ course, isEnrolled = false }: CourseCardProps) {
  const teacherName = course.teacher?.profile?.full_name ?? "مدرس تمكين";
  const subject = course.subject ?? course.teacher?.subject ?? "كورس تعليمي";
  const sectionLabel = course.target_section
    ? (sectionLabels[course.target_section as keyof typeof sectionLabels] ??
      course.target_section)
    : null;
  const courseHref = buildCourseHref(course);
  const actionHref = isEnrolled
    ? buildCourseHref(course, "study")
    : buildCourseHref(course, "purchase");

  return (
    <article className="card-modern gradient-border group flex h-full flex-col bg-white/90">
      <Link
        href={courseHref}
        className="relative block aspect-video overflow-hidden"
      >
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="from-primary-50 via-surface to-accent-100 flex h-full items-center justify-center bg-gradient-to-br px-6 text-center">
            <span className="text-primary-700 text-xl font-black">
              {subject}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
        <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3">
          <span className="inline-flex max-w-full items-center rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-xs font-black text-white shadow-[0_10px_24px_rgb(0_0_0/0.18)] backdrop-blur-md">
            <span className="truncate">{subject}</span>
          </span>
          {isEnrolled ? (
            <span className="text-primary-700 shrink-0 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black shadow-[var(--shadow-card)]">
              مشترك
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-3">
          <Link href={courseHref}>
            <h2 className="group-hover:text-primary-700 line-clamp-2 min-h-14 text-xl leading-7 font-black transition-colors duration-300">
              {course.title}
            </h2>
          </Link>
          <p className="text-foreground/60 line-clamp-2 text-sm leading-6">
            {course.description ?? "تفاصيل الكورس هتظهر هنا قريبًا."}
          </p>
          {course.target_grade || course.target_section ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {course.target_grade ? (
                <span className="chip">{gradeLabels[course.target_grade]}</span>
              ) : null}
              {course.target_section ? (
                <span className="chip">{sectionLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          className="mt-auto grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto] sm:items-end"
          style={{ borderColor: "rgb(208 227 218 / 0.5)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            {course.teacher?.slug ? (
              <Link
                href={`/teachers/${course.teacher.slug}`}
                className="shrink-0"
              >
                {course.teacher.avatar_url ? (
                  <Image
                    src={course.teacher.avatar_url}
                    alt={teacherName}
                    width={44}
                    height={44}
                    className="rounded-full border-2 border-white/20 object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
                    style={{ width: 44, height: 44 }}
                  />
                ) : (
                  <span className="from-primary-600 to-primary-700 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black text-white shadow-md">
                    {teacherName.charAt(0)}
                  </span>
                )}
              </Link>
            ) : course.teacher?.avatar_url ? (
              <Image
                src={course.teacher.avatar_url}
                alt={teacherName}
                width={44}
                height={44}
                className="shrink-0 rounded-full border-2 border-white/20 object-cover shadow-md"
                style={{ width: 44, height: 44 }}
              />
            ) : (
              <span className="from-primary-600 to-primary-700 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black text-white shadow-md">
                {teacherName.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-foreground/50 text-xs font-black">المدرس</p>
              {course.teacher?.slug ? (
                <Link
                  href={`/teachers/${course.teacher.slug}`}
                  className="hover:text-primary-700 mt-1 block truncate text-sm font-black transition-colors duration-300"
                >
                  {teacherName}
                </Link>
              ) : (
                <p className="mt-1 truncate text-sm font-black">
                  {teacherName}
                </p>
              )}
            </div>
          </div>
          <div className="border-primary-100 bg-primary-50/80 rounded-xl border px-4 py-2.5 text-center sm:text-left">
            <p className="text-foreground/50 text-[11px] font-black">السعر</p>
            <p className="text-primary-700 mt-0.5 text-xl leading-none font-black">
              {formatPrice(course.price)}
            </p>
          </div>
        </div>

        <Link
          href={actionHref}
          className={`flex w-full justify-center px-4 py-3 text-sm ${
            isEnrolled ? "btn-secondary" : "btn-primary"
          }`}
        >
          {isEnrolled ? "اكمل الدراسة" : "شراء الكورس"}
        </Link>
      </div>
    </article>
  );
}
