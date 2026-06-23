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

type GeneratedCodeExportDetails = {
  courseName: string;
  teacherName: string;
  expiresAt?: string;
};

function getSafeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function downloadFile(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildTxtContent(codes: string[], details: GeneratedCodeExportDetails) {
  return [
    "منصة تمكين - أكواد تفعيل",
    `اسم المدرس: ${details.teacherName}`,
    `اسم الكورس: ${details.courseName}`,
    details.expiresAt ? `تاريخ الصلاحية: ${formatDate(details.expiresAt)}` : "",
    `عدد الأكواد: ${codes.length.toLocaleString("ar-EG")}`,
    "",
    "الأكواد:",
    ...codes,
    "",
  ]
    .filter((line, index) => line || index === 5)
    .join("\r\n");
}

function downloadTxtCodes(
  codes: string[],
  details: GeneratedCodeExportDetails,
) {
  const filenameCourse = getSafeFilenamePart(details.courseName) || "course";

  downloadFile(
    `\uFEFF${buildTxtContent(codes, details)}`,
    "text/plain;charset=utf-8;",
    `tamkeen-${filenameCourse}-activation-codes.txt`,
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildExcelContent(
  codes: string[],
  details: GeneratedCodeExportDetails,
) {
  const generatedAt = new Date().toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const expiresAt = details.expiresAt
    ? formatDate(details.expiresAt)
    : "غير محدد";
  const rows = codes
    .map(
      (code, index) => `
        <tr>
          <td>${(index + 1).toLocaleString("ar-EG")}</td>
          <td class="code">${escapeHtml(code)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, Tahoma, sans-serif; direction: rtl; }
      .title { background: #102a43; color: #ffffff; font-size: 20px; font-weight: 700; text-align: center; }
      .meta-label { background: #d9e8f5; font-weight: 700; width: 160px; }
      .meta-value { background: #f7fbff; font-weight: 700; }
      .table-head { background: #f0b429; color: #111827; font-weight: 700; text-align: center; }
      td { border: 1px solid #8aa4b8; padding: 10px; mso-number-format: "\\@"; }
      .code { direction: ltr; text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 3px; }
    </style>
  </head>
  <body>
    <table>
      <tr><td class="title" colspan="2">منصة تمكين - أكواد تفعيل</td></tr>
      <tr><td class="meta-label">اسم المدرس</td><td class="meta-value">${escapeHtml(details.teacherName)}</td></tr>
      <tr><td class="meta-label">اسم الكورس</td><td class="meta-value">${escapeHtml(details.courseName)}</td></tr>
      <tr><td class="meta-label">تاريخ الصلاحية</td><td class="meta-value">${escapeHtml(expiresAt)}</td></tr>
      <tr><td class="meta-label">تاريخ التصدير</td><td class="meta-value">${escapeHtml(generatedAt)}</td></tr>
      <tr><td class="meta-label">عدد الأكواد</td><td class="meta-value">${codes.length.toLocaleString("ar-EG")}</td></tr>
      <tr><td colspan="2"></td></tr>
      <tr><td class="table-head">م</td><td class="table-head">كود التفعيل</td></tr>
      ${rows}
    </table>
  </body>
</html>`;
}

function downloadExcelCodes(
  codes: string[],
  details: GeneratedCodeExportDetails,
) {
  const filenameCourse = getSafeFilenamePart(details.courseName) || "course";

  downloadFile(
    `\uFEFF${buildExcelContent(codes, details)}`,
    "application/vnd.ms-excel;charset=utf-8;",
    `tamkeen-${filenameCourse}-activation-codes.xls`,
  );
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
  const generatedCourse = courses.find(
    (course) => course.id === state.values?.courseId,
  );
  const generatedCodeExportDetails: GeneratedCodeExportDetails = {
    courseName: generatedCourse?.title ?? "كورس غير معروف",
    teacherName:
      generatedCourse?.teacher?.profile?.full_name ?? "مدرس غير معروف",
    expiresAt: state.values?.expiresAt,
  };
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
        <form action={formAction} className="flex flex-wrap items-start gap-3">
          <label className="min-w-[240px] flex-[1_1_280px] space-y-2">
            <span className="text-foreground/70 text-sm font-bold">الكورس</span>
            <select
              name="courseId"
              defaultValue={state.values?.courseId ?? ""}
              className="field bg-background/60 min-w-0"
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
          <label className="min-w-[110px] flex-[0_1_130px] space-y-2">
            <span className="text-foreground/70 text-sm font-bold">العدد</span>
            <input
              name="quantity"
              type="number"
              min={1}
              max={200}
              defaultValue={state.values?.quantity ?? "10"}
              className="field bg-background/60 min-w-0"
            />
            <ErrorText message={state.fieldErrors?.quantity?.[0]} />
          </label>
          <label className="min-w-[220px] flex-[1_1_220px] space-y-2">
            <span className="text-foreground/70 text-sm font-bold">
              تاريخ الصلاحية
            </span>
            <input
              name="expiresAt"
              type="datetime-local"
              defaultValue={state.values?.expiresAt ?? ""}
              className="field bg-background/60 min-w-0"
            />
            <ErrorText message={state.fieldErrors?.expiresAt?.[0]} />
          </label>
          <button
            type="submit"
            disabled={isPending || courses.length === 0}
            className="btn-primary h-[46px] min-w-[84px] self-end px-5 py-0"
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
                onClick={() =>
                  downloadTxtCodes(generatedCodes, generatedCodeExportDetails)
                }
              >
                تحميل TXT
              </button>
              <button
                type="button"
                className="btn-primary px-3 py-2 text-xs"
                onClick={() =>
                  downloadExcelCodes(generatedCodes, generatedCodeExportDetails)
                }
              >
                تحميل Excel
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
