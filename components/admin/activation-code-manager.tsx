"use client";

import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  deleteActivationCodeAction,
  generateActivationCodesAction,
} from "@/lib/admin/actions";
import type { AdminActivationCode, AdminCourse } from "@/lib/admin/data";
import { formatPrice } from "@/lib/format";
import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";

type ActivationCodeManagerProps = {
  courses: AdminCourse[];
  codes: AdminActivationCode[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function codeStatus(code: AdminActivationCode) {
  if (code.used_at) {
    return { label: "مستخدم", tone: "used" as const };
  }

  if (new Date(code.expires_at) <= new Date()) {
    return { label: "منتهي", tone: "expired" as const };
  }

  return { label: "متاح", tone: "available" as const };
}

function downloadCodes(codes: string[]) {
  const blob = new Blob([codes.join("\n")], {
    type: "text/plain;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tamkeen-activation-codes.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function DeleteActivationCodeForm({ codeId }: { codeId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteActivationCodeAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="codeId" value={codeId} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-secondary px-3 py-2 text-xs text-red-700"
        onClick={(event) => {
          if (!confirm("هل تريد حذف الكود؟")) {
            event.preventDefault();
          }
        }}
      >
        {isPending ? "جاري..." : "حذف"}
      </button>
      {state.message ? <FormFeedback state={state} /> : null}
    </form>
  );
}

export function ActivationCodeManager({
  courses,
  codes,
}: ActivationCodeManagerProps) {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [state, formAction, isPending] = useActionState(
    generateActivationCodesAction,
    initialActionState,
  );
  const generatedCodes = (state.values?.generatedCodes ?? "")
    .split(",")
    .filter(Boolean);
  const filteredCodes = useMemo(() => {
    const normalized = query.trim();

    return codes.filter((code) => {
      const status = codeStatus(code).tone;
      const matchesQuery =
        !normalized ||
        code.code.includes(normalized) ||
        code.course?.title.includes(normalized);
      const matchesCourse =
        courseFilter === "all" || code.course_id === courseFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesQuery && matchesCourse && matchesStatus;
    });
  }, [codes, courseFilter, query, statusFilter]);

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong rounded-xl p-5">
        <div className="mb-4">
          <p className="eyebrow">توليد الأكواد</p>
          <h3 className="text-lg font-black">أكواد تفعيل كورس</h3>
        </div>
        <form
          action={formAction}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_130px_220px_auto]"
        >
          <label className="space-y-2">
            <span className="text-foreground/70 text-sm font-bold">الكورس</span>
            <select
              name="courseId"
              defaultValue={state.values?.courseId ?? ""}
              className="field bg-background/60"
            >
              <option value="" disabled>
                اختار الكورس
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} - {formatPrice(course.price)}
                </option>
              ))}
            </select>
            <ErrorText message={state.fieldErrors?.courseId?.[0]} />
          </label>
          <label className="space-y-2">
            <span className="text-foreground/70 text-sm font-bold">العدد</span>
            <input
              name="quantity"
              type="number"
              min={1}
              max={200}
              defaultValue={state.values?.quantity ?? "10"}
              className="field bg-background/60"
            />
            <ErrorText message={state.fieldErrors?.quantity?.[0]} />
          </label>
          <label className="space-y-2">
            <span className="text-foreground/70 text-sm font-bold">
              تاريخ الصلاحية
            </span>
            <input
              name="expiresAt"
              type="datetime-local"
              defaultValue={state.values?.expiresAt ?? ""}
              className="field bg-background/60"
            />
            <ErrorText message={state.fieldErrors?.expiresAt?.[0]} />
          </label>
          <button
            type="submit"
            disabled={isPending || courses.length === 0}
            className="btn-primary self-end px-5 py-3"
          >
            {isPending ? "جاري..." : "توليد"}
          </button>
        </form>
        <div className="mt-4">
          <FormFeedback state={state} />
        </div>
        {generatedCodes.length > 0 ? (
          <div className="mt-4 rounded-xl border bg-white/65 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-black">الأكواد الجديدة</p>
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs"
                onClick={() => downloadCodes(generatedCodes)}
              >
                تحميل TXT
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {generatedCodes.map((code) => (
                <code
                  key={code}
                  className="rounded-lg bg-white px-3 py-2 text-center text-lg font-black tracking-[0.18em]"
                  dir="ltr"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="glass-panel-strong rounded-xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))
            }
            className="field bg-background/60"
            placeholder="بحث برقم الكود"
            inputMode="numeric"
            dir="ltr"
          />
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.currentTarget.value)}
            className="field bg-background/60"
          >
            <option value="all">كل الكورسات</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value)}
            className="field bg-background/60"
          >
            <option value="all">كل الحالات</option>
            <option value="available">متاح</option>
            <option value="used">مستخدم</option>
            <option value="expired">منتهي</option>
          </select>
        </div>
      </section>

      <div className="grid gap-3">
        {filteredCodes.map((code) => {
          const status = codeStatus(code);
          const canDelete = !code.used_at;

          return (
            <article key={code.id} className="card-modern p-4">
              <div className="grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)_auto] lg:items-start">
                <div>
                  <p className="text-foreground/50 text-xs font-bold">
                    كود التفعيل
                  </p>
                  <p
                    className="mt-1 text-2xl font-black tracking-[0.18em]"
                    dir="ltr"
                  >
                    {code.code}
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">
                      {code.course?.title ?? "كورس محذوف"}
                    </h3>
                    <span
                      className={
                        status.tone === "available"
                          ? "chip"
                          : "text-foreground/60 rounded-lg bg-white/70 px-2.5 py-1 text-xs font-black"
                      }
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-foreground/60 mt-2 text-sm leading-6">
                    المدرس:{" "}
                    {code.course?.teacher?.profile?.full_name ??
                      "مدرس غير معروف"}{" "}
                    · ينتهي: {formatDate(code.expires_at)}
                  </p>
                  {code.used_at ? (
                    <p className="text-foreground/60 mt-2 text-sm leading-6">
                      اتفعل بواسطة{" "}
                      {code.used_by_student?.profile?.full_name ?? "طالب"} ·{" "}
                      {code.used_by_student?.student_phone ?? "بدون رقم"} ·{" "}
                      {formatDate(code.used_at)}
                    </p>
                  ) : null}
                </div>
                {canDelete ? (
                  <DeleteActivationCodeForm codeId={code.id} />
                ) : null}
              </div>
            </article>
          );
        })}
        {filteredCodes.length === 0 ? (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد أكواد مطابقة.
          </div>
        ) : null}
      </div>
    </div>
  );
}
