"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  deleteTeacherAction,
  toggleTeacherActiveAction,
} from "@/lib/admin/actions";
import type { AdminTeacher } from "@/lib/admin/data";

export function AdminTeachersTable({ teachers }: { teachers: AdminTeacher[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesQuery =
        !normalized ||
        (teacher.profile?.full_name ?? "").toLowerCase().includes(normalized) ||
        teacher.subject.toLowerCase().includes(normalized);
      const matchesStatus =
        status === "all" ||
        (status === "active" ? teacher.is_active : !teacher.is_active);

      return matchesQuery && matchesStatus;
    });
  }, [query, status, teachers]);

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="field bg-background/60"
          placeholder="بحث بالاسم أو المادة"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="field bg-background/60"
        >
          <option value="all">كل المدرسين</option>
          <option value="active">مفعل</option>
          <option value="inactive">موقوف</option>
        </select>
      </div>

      <div className="glass-panel-strong overflow-x-auto rounded-xl">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-primary-50/70 text-primary-800">
            <tr>
              <th className="px-4 py-3 text-right">المدرس</th>
              <th className="px-4 py-3 text-right">المادة</th>
              <th className="px-4 py-3 text-right">الإحصائيات</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-primary-100 divide-y">
            {filtered.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar-ring relative h-11 w-11 overflow-hidden rounded-xl">
                      {(teacher.avatar_url ?? teacher.profile?.avatar_url) ? (
                        <Image
                          src={
                            teacher.avatar_url ??
                            teacher.profile?.avatar_url ??
                            ""
                          }
                          alt={teacher.profile?.full_name ?? "صورة المدرس"}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="bg-primary-500 text-primary-foreground flex h-full items-center justify-center font-black">
                          {(teacher.profile?.full_name ?? "م").slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-black">
                        {teacher.profile?.full_name ?? "مدرس بدون اسم"}
                      </p>
                      <p className="text-foreground/55 mt-1">
                        {teacher.profile?.phone ?? "لا يوجد رقم"} ·{" "}
                        {teacher.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{teacher.subject}</td>
                <td className="px-4 py-4">
                  {teacher.courses.length.toLocaleString("ar-EG")} كورس
                </td>
                <td className="px-4 py-4">
                  <span className="chip">
                    {teacher.is_active ? "مفعل" : "موقوف"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/teachers/${teacher.slug}`}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      عرض
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
                      <button className="btn-secondary px-3 py-2 text-xs">
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
                        className="btn-secondary px-3 py-2 text-xs text-red-700"
                        onClick={(event) => {
                          if (!confirm("هل تريد حذف المدرس نهائيا؟")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        حذف
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="text-foreground/60 px-5 py-12 text-center">
            لا توجد نتائج مطابقة.
          </p>
        ) : null}
      </div>
    </div>
  );
}
