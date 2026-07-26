"use client";

import { useMemo, useState } from "react";

import {
  exportDatasetGroupLabels,
  exportDatasetGroupOrder,
  exportDatasetKeys,
  exportDatasets,
  type ExportDatasetCounts,
  type ExportDatasetKey,
} from "@/lib/admin/export-datasets";
import { cn } from "@/lib/utils";

function formatCount(count: number | null) {
  if (count === null) {
    return "غير متاح";
  }

  return `${count.toLocaleString("ar-EG")} صف`;
}

function getFilenameFromResponse(response: Response) {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);

  return match?.[1] ?? "tamkeen-data.xlsx";
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function AdminExportPanel({ counts }: { counts: ExportDatasetCounts }) {
  // A null count means the table isn't in this database, so it can't be exported.
  const availableKeys = useMemo(
    () => exportDatasetKeys.filter((key) => counts[key] !== null),
    [counts],
  );

  const [selected, setSelected] = useState<ExportDatasetKey[]>(availableKeys);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const selectedRows = useMemo(
    () =>
      selected.reduce((total, key) => total + Math.max(counts[key] ?? 0, 0), 0),
    [counts, selected],
  );

  const toggle = (key: ExportDatasetKey) => {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const download = async (keys: ExportDatasetKey[]) => {
    if (keys.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);
    setError(null);
    setLastFile(null);

    try {
      const response = await fetch(
        `/api/admin/export?datasets=${encodeURIComponent(keys.join(","))}`,
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "مقدرناش نجهز الملف. جرب تاني.");
      }

      const filename = getFilenameFromResponse(response);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setLastFile(filename);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "مقدرناش نجهز الملف. جرب تاني.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong rounded-xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">تصدير سريع</p>
            <h3 className="text-lg font-black">نزّل كل البيانات مرة واحدة</h3>
            <p className="text-foreground/60 mt-1 text-sm font-semibold">
              ملف Excel واحد فيه شيت لكل نوع بيانات: أسماء الطلاب، أرقام
              تليفوناتهم، اشتراكاتهم، الطلبات، الأكواد وكل حاجة في الداتا بيز.
            </p>
          </div>
          <button
            type="button"
            onClick={() => download(availableKeys)}
            disabled={isExporting}
            className="btn-primary px-5 py-3 text-sm"
          >
            {isExporting ? "بنجهز الملف..." : "تحميل كل البيانات (Excel)"}
          </button>
        </div>
      </section>

      <section className="glass-panel-strong rounded-xl p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">تصدير مخصص</p>
            <h3 className="text-lg font-black">اختار البيانات اللي عايزها</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              {selected.length.toLocaleString("ar-EG")} من{" "}
              {availableKeys.length.toLocaleString("ar-EG")} شيت ·{" "}
              {selectedRows.toLocaleString("ar-EG")} صف
            </span>
            <button
              type="button"
              onClick={() => setSelected(availableKeys)}
              className="btn-secondary px-3 py-2 text-xs"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="btn-secondary px-3 py-2 text-xs"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {exportDatasetGroupOrder.map((group) => {
            const groupDatasets = exportDatasets.filter(
              (dataset) => dataset.group === group,
            );

            return (
              <div key={group}>
                <h4 className="text-foreground/70 mb-2 text-sm font-black">
                  {exportDatasetGroupLabels[group]}
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {groupDatasets.map((dataset) => {
                    const count = counts[dataset.key];
                    const unavailable = count === null;
                    const active = selected.includes(dataset.key);

                    return (
                      <label
                        key={dataset.key}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 transition-all duration-300",
                          unavailable
                            ? "border-primary-100/50 cursor-not-allowed bg-white/35 opacity-60"
                            : active
                              ? "border-primary-200 bg-primary-50/60 cursor-pointer"
                              : "border-primary-100/70 cursor-pointer bg-white/55 hover:bg-white/80",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          disabled={unavailable}
                          onChange={() => toggle(dataset.key)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-200",
                            active
                              ? "border-primary-600 bg-primary-600 text-white"
                              : "border-primary-200 bg-white text-transparent",
                          )}
                        >
                          <CheckIcon />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-black">
                              {dataset.sheetName}
                            </span>
                            <span className="text-foreground/45 text-xs font-bold">
                              {formatCount(count)}
                            </span>
                          </span>
                          <span className="text-foreground/55 mt-1 block text-sm font-semibold">
                            {unavailable
                              ? "الجدول ده مش موجود في الداتا بيز الحالية."
                              : dataset.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-primary-100/70 mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-foreground/55 text-sm font-semibold">
            الملف بينزل بصيغة .xlsx وكل شيت فيه فلتر جاهز وعنوان مثبّت.
          </p>
          <button
            type="button"
            onClick={() => download(selected)}
            disabled={isExporting || selected.length === 0}
            className="btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "بنجهز الملف..." : "تحميل المحدد"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}

        {lastFile ? (
          <p className="text-primary-700 bg-primary-50/70 mt-3 rounded-xl px-3 py-2 text-sm font-bold">
            تم تحميل <span dir="ltr">{lastFile}</span> بنجاح.
          </p>
        ) : null}
      </section>
    </div>
  );
}
