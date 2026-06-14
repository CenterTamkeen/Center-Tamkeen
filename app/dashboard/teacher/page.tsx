import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/roles";
import { getCurrentTeacher, getTeacherStats } from "@/lib/teacher/data";
import { formatPrice } from "@/lib/storefront/data";

export const metadata: Metadata = {
  title: "لوحة المدرس",
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

export default async function TeacherDashboardPage() {
  const { profile } = await requireRole("teacher", "/dashboard/teacher");
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    return (
      <div className="card-modern p-6">
        <h2 className="text-lg font-black">ملف المدرس غير مكتمل</h2>
        <p className="text-foreground/65 mt-3 leading-7">
          الحساب له صلاحية مدرس، لكن لا يوجد صف مرتبط به في جدول المدرسين. أنشئ
          المدرس من لوحة الإدارة عند تفعيل Phase 6.
        </p>
      </div>
    );
  }

  const stats = await getTeacherStats(teacher.id);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="الكورسات"
          value={stats.totalCourses.toLocaleString("ar-EG")}
          hint={`${stats.publishedCourses.toLocaleString("ar-EG")} منشور حاليًا`}
        />
        <StatCard
          label="الحصص"
          value={stats.totalLessons.toLocaleString("ar-EG")}
          hint="إجمالي الحصص داخل كورساتك"
        />
        <StatCard
          label="الطلاب"
          value={stats.studentCount.toLocaleString("ar-EG")}
          hint="من الاشتراكات المكتملة فقط"
        />
        <StatCard
          label="الكوبونات الفعالة"
          value={stats.activeCoupons.toLocaleString("ar-EG")}
          hint="كوبونات متاحة للاستخدام"
        />
        <StatCard
          label="الأرباح المؤكدة"
          value={formatPrice(stats.totalEarnings)}
          hint="محسوبة من teacher_earnings بعد اكتمال الطلبات فقط"
        />
      </section>

      <section className="glass-panel-strong rounded-xl p-5">
        <h2 className="text-lg font-black">حالة المدرس</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <p className="chip">المادة: {teacher.subject}</p>
          <p className="chip">الرابط: {teacher.slug}</p>
          <p className="chip">
            {teacher.is_active ? "الحساب مفعل" : "الحساب موقوف"}
          </p>
        </div>
      </section>
    </div>
  );
}
