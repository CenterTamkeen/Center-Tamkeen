import type { Metadata } from "next";

import { AdminReportsPanel } from "@/components/admin/admin-reports-panel";
import {
  getAdminFinancialReportDetails,
  getAdminStats,
  getAdminTeacherEarningsReport,
} from "@/lib/admin/data";
import { formatPrice } from "@/lib/storefront/data";

export const metadata: Metadata = {
  title: "التقارير المالية",
};

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-primary-100 flex items-center justify-between gap-4 border-b py-4 last:border-b-0">
      <span className="font-bold">{label}</span>
      <span className="heading-gradient text-xl font-black">{value}</span>
    </div>
  );
}

export default async function AdminReportsPage() {
  const [stats, teacherEarnings, details] = await Promise.all([
    getAdminStats(),
    getAdminTeacherEarningsReport(),
    getAdminFinancialReportDetails(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">التقارير</p>
        <h2 className="text-xl font-black">ملخص مالي للمنصة</h2>
      </div>

      <section className="card-modern p-5">
        <ReportRow
          label="إجمالي المبيعات المكتملة"
          value={formatPrice(stats.totalSales)}
        />
        <ReportRow
          label="أرباح المدرسين المسجلة"
          value={formatPrice(stats.teacherEarnings)}
        />
        <ReportRow
          label="أرباح سنتر تمكين"
          value={formatPrice(stats.centerEarnings)}
        />
        <ReportRow
          label="عدد الكوبونات المستخدمة"
          value={stats.usedCoupons.toLocaleString("ar-EG")}
        />
        <ReportRow
          label="قيمة الخصومات المسجلة"
          value={formatPrice(stats.couponDiscountImpact)}
        />
        <ReportRow
          label="الطلبات المكتملة"
          value={stats.completedOrders.toLocaleString("ar-EG")}
        />
        <ReportRow
          label="الطلبات المرفوضة"
          value={stats.rejectedOrders.toLocaleString("ar-EG")}
        />
      </section>

      <AdminReportsPanel teacherEarnings={teacherEarnings} details={details} />
    </div>
  );
}
