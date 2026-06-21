import type { Metadata } from "next";
import Image from "next/image";

import {
  blockStudentAction,
  unblockStudentAction,
} from "@/lib/student-blocks/actions";
import { getAdminStudents } from "@/lib/admin/data";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

export const metadata: Metadata = {
  title: "إدارة الطلاب",
};

const genderLabels = {
  male: "ذكر",
  female: "أنثى",
} as const;

const legacySectionLabels = {
  general: "عام",
  scientific: "علمي",
  literary: "أدبي",
  science: "علوم",
  mathematics: "رياضة",
} as const;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

function getSectionLabel(section: string) {
  if (section in sectionLabels) {
    return sectionLabels[section as keyof typeof sectionLabels];
  }

  return (
    legacySectionLabels[section as keyof typeof legacySectionLabels] ?? section
  );
}

function StudentDetail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="border-primary-100/70 rounded-xl border bg-white/55 px-3 py-2.5">
      <p className="text-foreground/50 text-xs font-bold">{label}</p>
      <p className="text-foreground mt-1 text-sm font-black break-words">
        {value || "غير مسجل"}
      </p>
    </div>
  );
}

export default async function AdminStudentsPage() {
  const students = await getAdminStudents();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">الطلاب</p>
          <h2 className="text-xl font-black">
            إدارة بيانات الطلاب والاشتراكات
          </h2>
        </div>
        <div className="chip">
          {students.length.toLocaleString("ar-EG")} طالب مسجل
        </div>
      </div>

      <div className="grid gap-4">
        {students.length > 0 ? (
          students.map((student) => {
            const blocked = student.student_blocks.length > 0;
            const photoUrl = student.photo_url ?? student.profile?.avatar_url;
            const coursesCount = student.enrollments.length;

            return (
              <details key={student.id} className="card-modern group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-4 marker:hidden sm:p-5 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="border-primary-100 text-primary-700 grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-white/70 transition-transform duration-300 group-open:rotate-180">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>

                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt=""
                        width={56}
                        height={56}
                        className="border-primary-100 h-14 w-14 rounded-2xl border object-cover shadow-sm"
                      />
                    ) : (
                      <div className="border-primary-100 bg-primary-50 text-primary-700 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-lg font-black">
                        {(student.profile?.full_name ?? "ط").trim().charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg leading-7 font-black">
                          {student.profile?.full_name ?? "طالب بدون اسم"}
                        </h3>
                        <span
                          className={
                            blocked
                              ? "inline-flex rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700"
                              : "chip"
                          }
                        >
                          {blocked ? "محظور" : "نشط"}
                        </span>
                      </div>
                      <p className="text-foreground/55 mt-1 text-sm font-semibold">
                        {student.student_phone} ·{" "}
                        {coursesCount.toLocaleString("ar-EG")} كورس
                      </p>
                    </div>
                  </div>

                  <div className="border-primary-100/80 bg-primary-50/70 rounded-2xl border px-4 py-2 text-center">
                    <p className="text-primary-700 text-lg font-black">
                      {coursesCount.toLocaleString("ar-EG")}
                    </p>
                    <p className="text-foreground/55 text-xs font-bold">
                      كورس مشترك
                    </p>
                  </div>
                </summary>

                <div className="border-primary-100/70 border-t px-4 pt-0 pb-4 sm:px-5 sm:pb-5">
                  <div className="grid gap-5 pt-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
                    <div className="min-w-0 space-y-4">
                      <p className="text-foreground/55 text-sm font-semibold">
                        مسجل منذ {formatDate(student.created_at)}
                      </p>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <StudentDetail
                          label="رقم الطالب"
                          value={student.student_phone}
                        />
                        <StudentDetail
                          label="رقم ولي الأمر"
                          value={student.father_phone}
                        />
                        <StudentDetail
                          label="الإيميل"
                          value={student.profile?.email}
                        />
                        <StudentDetail
                          label="المدرسة"
                          value={student.school_name}
                        />
                        <StudentDetail
                          label="النوع"
                          value={genderLabels[student.gender]}
                        />
                        <StudentDetail
                          label="السنة الدراسية"
                          value={gradeLabels[student.grade]}
                        />
                        <StudentDetail
                          label="المسار"
                          value={getSectionLabel(student.section)}
                        />
                        <StudentDetail
                          label="آخر تحديث"
                          value={formatDate(student.updated_at)}
                        />
                      </div>

                      <section className="border-primary-100/80 bg-primary-50/35 rounded-2xl border p-3">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-black">الكورسات المشترك فيها</h4>
                          <span className="text-foreground/55 text-xs font-bold">
                            {coursesCount > 0
                              ? `${coursesCount.toLocaleString("ar-EG")} اشتراك`
                              : "لا يوجد اشتراكات"}
                          </span>
                        </div>

                        {coursesCount > 0 ? (
                          <div className="grid gap-2 md:grid-cols-2">
                            {student.enrollments.map((enrollment) => (
                              <div
                                key={enrollment.id}
                                className="rounded-xl border border-white/80 bg-white/70 px-3 py-3"
                              >
                                <p className="leading-7 font-black">
                                  {enrollment.course?.title ?? "كورس غير معروف"}
                                </p>
                                <p className="text-foreground/60 mt-1 text-sm font-semibold">
                                  {enrollment.course?.teacher?.profile
                                    ?.full_name ?? "مدرس غير معروف"}
                                  {enrollment.course?.subject
                                    ? ` · ${enrollment.course.subject}`
                                    : ""}
                                </p>
                                <p className="text-foreground/45 mt-2 text-xs font-bold">
                                  تاريخ الاشتراك:{" "}
                                  {formatDate(enrollment.enrolled_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border-primary-200 text-foreground/55 rounded-xl border border-dashed bg-white/45 px-4 py-5 text-center text-sm font-bold">
                            الطالب لم يشترك في أي كورس حتى الآن.
                          </div>
                        )}
                      </section>

                      {student.student_blocks[0]?.reason ? (
                        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                          سبب البلوك: {student.student_blocks[0].reason}
                        </p>
                      ) : null}
                    </div>

                    {blocked ? (
                      <form
                        action={unblockStudentAction}
                        className="flex items-start xl:justify-end"
                      >
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <button className="btn-secondary w-full px-3 py-2 text-xs xl:w-auto">
                          فك البلوك
                        </button>
                      </form>
                    ) : (
                      <form
                        action={blockStudentAction}
                        className="grid content-start gap-2"
                      >
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <input
                          name="reason"
                          placeholder="سبب اختياري"
                          className="field bg-background/60 py-2 text-sm"
                        />
                        <button className="btn-secondary px-3 py-2 text-xs text-red-700">
                          بلوك الطالب
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </details>
            );
          })
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا يوجد طلاب حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
