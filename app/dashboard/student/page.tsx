import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { requireRole } from "@/lib/auth/roles";
import { getProfileNotifications } from "@/lib/notifications/data";
import { getStudentDashboard } from "@/lib/student/data";
import { buildCourseHref } from "@/lib/storefront/links";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

export const metadata: Metadata = {
  title: "بوابة الطالب",
};

function StudentStatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "blue" | "orange" | "green";
  icon: React.ReactNode;
}) {
  const toneClasses = {
    blue: {
      box: "bg-blue-50 text-blue-700",
      value: "text-blue-700",
    },
    orange: {
      box: "bg-orange-50 text-orange-600",
      value: "text-orange-600",
    },
    green: {
      box: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },
  }[tone];

  return (
    <article className="card-modern p-5">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses.box}`}
        >
          {icon}
        </div>
        <div className="text-right">
          <p className="text-foreground/65 text-sm font-semibold">{label}</p>
          <p className={`mt-2 text-3xl font-black ${toneClasses.value}`}>
            {value}
          </p>
        </div>
      </div>
      <p className="text-foreground/55 mt-3 text-sm leading-6">{hint}</p>
    </article>
  );
}

export default async function StudentDashboardPage() {
  const { profile } = await requireRole("student", "/dashboard/student");
  const [dashboard, notifications] = await Promise.all([
    getStudentDashboard(profile.id),
    getProfileNotifications(profile.id),
  ]);

  if (!dashboard) {
    return (
      <DashboardShell
        title={`أهلًا ${profile.full_name}`}
        eyebrow="بوابة الطالب"
      >
        <div className="card-modern p-6">
          <h2 className="text-lg font-black">ملف الطالب غير مكتمل</h2>
          <p className="text-foreground/65 mt-3 leading-7">
            الحساب مسجل كطالب، لكن لا يوجد ملف طالب مرتبط به داخل قاعدة
            البيانات.
          </p>
          <Link
            href="/profile"
            className="btn-secondary mt-4 inline-flex px-4 py-2 text-sm"
          >
            تعديل الملف الشخصي
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const { stats, courses, student } = dashboard;
  const gradeLabel =
    gradeLabels[student.grade as keyof typeof gradeLabels] ??
    student.grade ??
    "غير محدد";
  const sectionLabel =
    sectionLabels[student.section as keyof typeof sectionLabels] ??
    student.section ??
    "غير محدد";

  return (
    <DashboardShell
      title={`مرحبًا يا ${profile.full_name}`}
      eyebrow="لوحة الطالب"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StudentStatCard
          label="إجمالي الكورسات"
          value={stats.totalCourses.toLocaleString("ar-EG")}
          hint={`${stats.totalLessons.toLocaleString("ar-EG")} درس داخل اشتراكاتك الحالية`}
          tone="blue"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          }
        />
        <StudentStatCard
          label="قيد الدراسة"
          value={stats.activeCourses.toLocaleString("ar-EG")}
          hint="كل الكورسات المسجل بها حاليًا"
          tone="orange"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StudentStatCard
          label="منتهية"
          value={stats.completedCourses.toLocaleString("ar-EG")}
          hint="كورسات وصلت فيها لكل الحصص المكتملة"
          tone="green"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <path d="m9 9 2 2 4-4" />
            </svg>
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="glass-panel-strong rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">كورساتي</p>
              <h2 className="text-2xl font-black">ابدأ أو كمّل مذاكرتك</h2>
            </div>
            <Link
              href="/courses"
              className="text-primary-700 text-sm font-bold"
            >
              تصفح المزيد
            </Link>
          </div>

          <div className="space-y-4">
            {courses.length > 0 ? (
              courses.map(({ enrollmentId, enrolledAt, course, progress }) => (
                <article
                  key={enrollmentId}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-28 overflow-hidden rounded-2xl sm:w-40">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="from-primary-50 to-accent-100 flex h-full items-center justify-center bg-gradient-to-br">
                        <span className="text-primary-700 px-3 text-center text-sm font-black">
                          {course.subject ?? course.teacher?.subject ?? "تمكين"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip">
                        {course.lessons.length.toLocaleString("ar-EG")} درس
                      </span>
                      <span className="chip">
                        {new Date(enrolledAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black">
                      {course.title}
                    </h3>
                    <p className="text-foreground/60 mt-2 line-clamp-2 text-sm leading-6">
                      {course.description ??
                        "ابدأ الدراسة من صفحة الكورس واستكمل دروسك."}
                    </p>
                    <p className="text-foreground/55 mt-2 text-sm">
                      المدرس:{" "}
                      {course.teacher?.profile?.full_name ?? "غير معروف"}
                    </p>
                    <div className="mt-3">
                      <div className="text-foreground/55 mb-1.5 flex items-center justify-between gap-3 text-xs font-black">
                        <span>تقدم الكورس</span>
                        <span>
                          {progress.progressPercent.toLocaleString("ar-EG")}%
                        </span>
                      </div>
                      <div className="bg-foreground/10 h-2 overflow-hidden rounded-full">
                        <div
                          className="from-primary-500 to-accent-500 h-full rounded-full bg-gradient-to-l"
                          style={{ width: `${progress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:flex-col">
                    <Link
                      href={buildCourseHref(course)}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      متابعة الدراسة
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-5 py-10 text-center">
                <h3 className="text-lg font-black">لا توجد كورسات بعد</h3>
                <p className="text-foreground/60 mx-auto mt-3 max-w-xl leading-7">
                  بمجرد الاشتراك في أي كورس سيظهر هنا تلقائيًا مع إحصائيات لوحة
                  الطالب.
                </p>
                <Link
                  href="/courses"
                  className="btn-secondary mt-5 inline-flex px-4 py-2 text-sm"
                >
                  استكشف الكورسات
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <NotificationsPanel notifications={notifications} />

          <section className="glass-panel-strong rounded-2xl p-5">
            <p className="eyebrow">ملخص الحساب</p>
            <h2 className="mt-1 text-xl font-black">بياناتي الدراسية</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-foreground/50 text-xs">رقم الطالب</p>
                <p className="mt-1 font-black">
                  {student.studentPhone ?? "غير مضاف"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-foreground/50 text-xs">المدرسة</p>
                <p className="mt-1 font-black">
                  {student.schoolName ?? "غير مضافة"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-foreground/50 text-xs">الصف</p>
                  <p className="mt-1 font-black">{gradeLabel}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-foreground/50 text-xs">المسار</p>
                  <p className="mt-1 font-black">{sectionLabel}</p>
                </div>
              </div>
            </div>
            <Link
              href="/profile"
              className="btn-secondary mt-4 inline-flex px-4 py-2 text-sm"
            >
              تعديل الملف الشخصي
            </Link>
          </section>
        </div>
      </section>
    </DashboardShell>
  );
}
