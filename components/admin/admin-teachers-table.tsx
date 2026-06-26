"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useActionState, useEffect, useMemo, useState } from "react";

import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";
import { initialActionState } from "@/lib/auth/action-state";
import {
  deleteTeacherAction,
  toggleTeacherActiveAction,
  updateTeacherAction,
} from "@/lib/admin/actions";
import type { AdminTeacher } from "@/lib/admin/data";

export function AdminTeachersTable({ teachers }: { teachers: AdminTeacher[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesQuery =
        !normalized ||
        (teacher.profile?.full_name ?? "").toLowerCase().includes(normalized) ||
        (teacher.profile?.email ?? "").toLowerCase().includes(normalized) ||
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
          placeholder="بحث بالاسم أو الإيميل أو المادة"
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

      <div className="grid gap-3 md:hidden">
        {filtered.map((teacher) => (
          <article key={teacher.id} className="card-modern p-4">
            <div className="flex items-start gap-3">
              <div className="avatar-ring relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                {(teacher.avatar_url ?? teacher.profile?.avatar_url) ? (
                  <Image
                    src={
                      teacher.avatar_url ?? teacher.profile?.avatar_url ?? ""
                    }
                    alt={teacher.profile?.full_name ?? "صورة المدرس"}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-primary-500 text-primary-foreground flex h-full items-center justify-center font-black">
                    {(teacher.profile?.full_name ?? "م").slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-black">
                      {teacher.profile?.full_name ?? "مدرس بدون اسم"}
                    </h3>
                    <p className="text-foreground/55 mt-1 text-sm">
                      {teacher.profile?.email ?? "إيميل غير متاح"}
                    </p>
                    <p className="text-foreground/45 mt-1 text-xs">
                      {teacher.subject} · {teacher.slug}
                    </p>
                  </div>
                  <span className="chip shrink-0">
                    {teacher.is_active ? "مفعل" : "موقوف"}
                  </span>
                </div>
                <p className="text-foreground/60 mt-2 text-sm font-semibold">
                  {teacher.courses.length.toLocaleString("ar-EG")} كورس
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={`/teachers/${teacher.slug}`}
                className="btn-secondary px-3 py-2 text-center text-xs"
              >
                عرض
              </Link>
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs"
                onClick={() =>
                  setEditingTeacherId((current) =>
                    current === teacher.id ? null : teacher.id,
                  )
                }
              >
                تعديل
              </button>
              <form action={toggleTeacherActiveAction}>
                <input type="hidden" name="teacherId" value={teacher.id} />
                <input
                  type="hidden"
                  name="nextActive"
                  value={teacher.is_active ? "false" : "true"}
                />
                <button className="btn-secondary w-full px-3 py-2 text-xs">
                  {teacher.is_active ? "إيقاف" : "تفعيل"}
                </button>
              </form>
              <TeacherDeleteForm teacherId={teacher.id} />
            </div>

            {editingTeacherId === teacher.id ? (
              <div className="bg-primary-50/30 mt-4 rounded-xl p-3">
                <TeacherEditForm
                  teacher={teacher}
                  onSaved={() => setEditingTeacherId(null)}
                />
              </div>
            ) : null}
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد نتائج مطابقة.
          </p>
        ) : null}
      </div>

      <div className="glass-panel-strong hidden overflow-x-auto rounded-xl md:block">
        <table className="w-full min-w-[960px] text-sm">
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
              <Fragment key={teacher.id}>
                <tr>
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
                        <p
                          className="text-foreground/55 mt-1 text-left break-all"
                          dir="ltr"
                        >
                          {teacher.profile?.email ?? "email unavailable"}
                        </p>
                        <p className="text-foreground/45 mt-1 text-xs">
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
                      <button
                        type="button"
                        className="btn-secondary px-3 py-2 text-xs"
                        onClick={() =>
                          setEditingTeacherId((current) =>
                            current === teacher.id ? null : teacher.id,
                          )
                        }
                      >
                        تعديل
                      </button>
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
                      <TeacherDeleteForm teacherId={teacher.id} />
                    </div>
                  </td>
                </tr>
                {editingTeacherId === teacher.id ? (
                  <tr>
                    <td colSpan={5} className="bg-primary-50/30 px-4 py-5">
                      <TeacherEditForm
                        teacher={teacher}
                        onSaved={() => setEditingTeacherId(null)}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
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

function TeacherDeleteForm({ teacherId }: { teacherId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteTeacherAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="teacherId" value={teacherId} />
      <button
        disabled={isPending}
        className="btn-secondary px-3 py-2 text-xs text-red-700"
        onClick={(event) => {
          if (!confirm("هل تريد حذف المدرس نهائيا؟")) {
            event.preventDefault();
          }
        }}
      >
        {isPending ? "جاري الحذف..." : "حذف"}
      </button>
      {state.status === "error" ? (
        <p className="max-w-48 text-xs font-semibold text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function TeacherEditForm({
  teacher,
  onSaved,
}: {
  teacher: AdminTeacher;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateTeacherAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSaved();
    }
  }, [onSaved, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="teacherId" value={teacher.id} />
      <FormFeedback state={state} />

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="grid min-w-0 gap-2">
          <span className="text-foreground/80 text-xs font-bold">
            اسم المدرس
          </span>
          <input
            name="fullName"
            defaultValue={
              state.values?.fullName ?? teacher.profile?.full_name ?? ""
            }
            className="field bg-background/70 min-w-0 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.fullName?.[0]} />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-foreground/80 text-xs font-bold">
            الرابط بالإنجليزي
          </span>
          <input
            name="englishName"
            defaultValue={state.values?.englishName ?? teacher.slug}
            className="field bg-background/70 min-w-0 py-2.5 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.englishName?.[0]} />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-foreground/80 text-xs font-bold">المادة</span>
          <input
            name="subject"
            defaultValue={state.values?.subject ?? teacher.subject}
            className="field bg-background/70 min-w-0 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.subject?.[0]} />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-foreground/80 text-xs font-bold">
            رقم التليفون
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={state.values?.phone ?? teacher.profile?.phone ?? ""}
            className="field bg-background/70 min-w-0 py-2.5 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.phone?.[0]} />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="grid min-w-0 gap-2">
          <span className="text-foreground/80 text-xs font-bold">
            صورة المدرس
          </span>
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field bg-background/70 min-w-0 py-2.5"
          />
          <p className="text-foreground/50 text-[11px] leading-4 font-semibold">
            المقاس المقترح: 800 × 800 بكسل بنسبة 1:1. JPG/PNG/WebP بحد أقصى 2MB.
          </p>
          <ErrorText message={state.fieldErrors?.avatar?.[0]} />
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm font-bold">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={teacher.is_active}
            className="h-4 w-4"
          />
          مفعل
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button disabled={isPending} className="btn-primary px-4 py-2 text-xs">
          {isPending ? "جاري الحفظ..." : "حفظ التعديل"}
        </button>
        <button
          type="button"
          className="btn-secondary px-4 py-2 text-xs"
          onClick={onSaved}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
