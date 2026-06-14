import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { TeacherCreateForm } from "@/components/admin/teacher-create-form";
import {
  deleteTeacherAction,
  toggleTeacherActiveAction,
} from "@/lib/admin/actions";
import { getAdminTeachers } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: "إدارة المدرسين",
};

export default async function AdminTeachersPage() {
  const teachers = await getAdminTeachers();

  return (
    <div className="space-y-6">
      <TeacherCreateForm />

      <section className="space-y-4">
        <div>
          <p className="eyebrow">المدرسين</p>
          <h2 className="text-xl font-black">حسابات المدرسين</h2>
        </div>

        <div className="grid gap-4">
          {teachers.length > 0 ? (
            teachers.map((teacher) => (
              <article key={teacher.id} className="card-modern p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="avatar-ring relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      {(teacher.avatar_url ?? teacher.profile?.avatar_url) ? (
                        <Image
                          src={
                            teacher.avatar_url ??
                            teacher.profile?.avatar_url ??
                            ""
                          }
                          alt={teacher.profile?.full_name ?? "صورة المدرس"}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="text-primary-foreground flex h-full items-center justify-center text-lg font-black"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
                          }}
                        >
                          {(teacher.profile?.full_name ?? "م").slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">
                          {teacher.profile?.full_name ?? "مدرس بدون اسم"}
                        </h3>
                        <span className="chip">
                          {teacher.is_active ? "مفعل" : "موقوف"}
                        </span>
                      </div>
                      <p className="text-foreground/65 mt-2 text-sm leading-6">
                        {teacher.subject} ·{" "}
                        {teacher.profile?.phone ?? "لا يوجد رقم"}
                      </p>
                      <div className="text-foreground/60 mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                        <span>الرابط: {teacher.slug}</span>
                        <span>
                          {teacher.courses.length.toLocaleString("ar-EG")} كورس
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/teachers/${teacher.slug}`}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      عرض الصفحة
                    </Link>
                    <form action={toggleTeacherActiveAction}>
                      <input
                        type="hidden"
                        name="teacherId"
                        value={teacher.id}
                      />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={teacher.is_active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="btn-secondary px-3 py-2 text-xs"
                      >
                        {teacher.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                    </form>
                    <form action={deleteTeacherAction}>
                      <input
                        type="hidden"
                        name="teacherId"
                        value={teacher.id}
                      />
                      <button
                        type="submit"
                        className="btn-secondary px-3 py-2 text-xs text-red-700"
                      >
                        حذف نهائي
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
              لا توجد حسابات مدرسين حتى الآن.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
