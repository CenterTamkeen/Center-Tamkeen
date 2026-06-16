"use client";

import { useMemo, useState } from "react";

import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { formatPrice } from "@/lib/format";

type TeacherEarning = {
  teacherId: string;
  teacherName: string;
  subject: string;
  total: number;
};

type ReportDetails = {
  salesByDate: { label: string; total: number }[];
  topCourses: {
    id: string;
    title: string;
    teacherName: string;
    enrollments: number;
    revenue: number;
  }[];
  coupons: {
    id: string;
    code: string;
    usedCount: number;
    discountValue: number;
    discountType: string;
  }[];
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminReportsPanel({
  teacherEarnings,
  details,
}: {
  teacherEarnings: TeacherEarning[];
  details: ReportDetails;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filteredSales = useMemo(() => {
    return details.salesByDate.filter((item) => {
      return (!from || item.label >= from) && (!to || item.label <= to);
    });
  }, [details.salesByDate, from, to]);

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong rounded-xl p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">المبيعات بالتاريخ</p>
            <h3 className="text-lg font-black">تقرير فترة مخصصة</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="field bg-background/60 py-2 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="field bg-background/60 py-2 text-sm"
            />
            <button
              type="button"
              className="btn-primary px-4 py-2 text-xs"
              onClick={() =>
                downloadCsv("tamkeen-report.csv", [
                  ["التاريخ", "المبيعات"],
                  ...filteredSales.map((item) => [
                    item.label,
                    String(item.total),
                  ]),
                  ["", ""],
                  ["المدرس", "المادة", "الأرباح"],
                  ...teacherEarnings.map((teacher) => [
                    teacher.teacherName,
                    teacher.subject,
                    String(teacher.total),
                  ]),
                ])
              }
            >
              Export CSV
            </button>
          </div>
        </div>
        <MiniBarChart data={filteredSales} valueType="money" />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="glass-panel-strong rounded-xl p-5">
          <h3 className="text-lg font-black">أرباح كل مدرس</h3>
          <div className="mt-4 space-y-3">
            {teacherEarnings.map((teacher) => (
              <div
                key={teacher.teacherId}
                className="rounded-xl bg-white/60 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{teacher.teacherName}</p>
                  <p className="text-primary-700 font-black">
                    {formatPrice(teacher.total)}
                  </p>
                </div>
                <p className="text-foreground/55 mt-1 text-sm">
                  {teacher.subject}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel-strong rounded-xl p-5">
          <h3 className="text-lg font-black">أكثر الكورسات مبيعا</h3>
          <div className="mt-4 space-y-3">
            {details.topCourses.map((course) => (
              <div key={course.id} className="rounded-xl bg-white/60 p-3">
                <p className="font-black">{course.title}</p>
                <p className="text-foreground/55 mt-1 text-sm">
                  {course.teacherName} ·{" "}
                  {course.enrollments.toLocaleString("ar-EG")} اشتراك
                </p>
                <p className="text-primary-700 mt-2 font-black">
                  {formatPrice(course.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel-strong rounded-xl p-5">
          <h3 className="text-lg font-black">الكوبونات المستخدمة</h3>
          <div className="mt-4 space-y-3">
            {details.coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/60 p-3"
              >
                <div>
                  <p className="font-black" dir="ltr">
                    {coupon.code}
                  </p>
                  <p className="text-foreground/55 mt-1 text-sm">
                    {coupon.discountValue} {coupon.discountType}
                  </p>
                </div>
                <span className="chip">
                  {coupon.usedCount.toLocaleString("ar-EG")} استخدام
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
