import type { Metadata } from "next";

import { getAdminStats } from "@/lib/admin/data";
import { formatPrice } from "@/lib/storefront/data";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="card-modern p-5">
      <p className="text-foreground/55 text-sm font-semibold">{label}</p>
      <p className="heading-gradient mt-2 text-3xl font-black">{value}</p>
      <p className="text-foreground/55 mt-2 text-sm leading-6">{hint}</p>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="المدرسين"
          value={stats.totalTeachers.toLocaleString("ar-EG")}
          hint={`${stats.activeTeachers.toLocaleString("ar-EG")} مدرس مفعل`}
        />
        <StatCard
          label="الكورسات"
          value={stats.totalCourses.toLocaleString("ar-EG")}
          hint={`${stats.publishedCourses.toLocaleString("ar-EG")} كورس منشور`}
        />
        <StatCard
          label="طلبات قيد الانتظار"
          value={stats.pendingOrders.toLocaleString("ar-EG")}
          hint="متابعة الطلبات لحين اعتمادها من الإدارة"
        />
        <StatCard
          label="طلبات مكتملة"
          value={stats.completedOrders.toLocaleString("ar-EG")}
          hint="تفتح الكورسات عبر Trigger قاعدة البيانات"
        />
        <StatCard
          label="إجمالي المبيعات"
          value={formatPrice(stats.totalSales)}
          hint="من الطلبات المكتملة فقط"
        />
        <StatCard
          label="أرباح السنتر"
          value={formatPrice(stats.centerEarnings)}
          hint="المبيعات ناقص أرباح المدرسين المسجلة"
        />
      </section>
    </div>
  );
}
