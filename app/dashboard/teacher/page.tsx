import type { Metadata } from "next";

import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { requireRole } from "@/lib/auth/roles";
import {
  getCurrentTeacher,
  getTeacherDashboardDetails,
  getTeacherStats,
} from "@/lib/teacher/data";
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

  const [stats, details] = await Promise.all([
    getTeacherStats(teacher.id),
    getTeacherDashboardDetails(teacher.id),
  ]);

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

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel-strong rounded-xl p-5">
          <div className="mb-4">
            <p className="eyebrow">المبيعات</p>
            <h2 className="text-lg font-black">الأرباح بمرور الوقت</h2>
          </div>
          <MiniBarChart data={details.salesByMonth} valueType="money" />
        </div>

        <div className="glass-panel-strong rounded-xl p-5">
          <div className="mb-4">
            <p className="eyebrow">الكورسات</p>
            <h2 className="text-lg font-black">الأكثر مبيعا</h2>
          </div>
          <div className="space-y-3">
            {details.topCourses.length > 0 ? (
              details.topCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/60 p-3"
                >
                  <div>
                    <p className="font-black">{course.title}</p>
                    <p className="text-foreground/55 mt-1 text-sm">
                      {course.enrollments.toLocaleString("ar-EG")} اشتراك
                    </p>
                  </div>
                  <p className="text-primary-700 font-black">
                    {formatPrice(course.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-foreground/60 py-8 text-center">
                لا توجد مبيعات بعد.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="glass-panel-strong rounded-xl p-5">
          <h2 className="text-lg font-black">أحدث الاشتراكات</h2>
          <div className="mt-4 space-y-3">
            {details.recentEnrollments.map((item) => (
              <div key={item.id} className="rounded-xl bg-white/60 p-3">
                <p className="font-black">{item.studentName}</p>
                <p className="text-foreground/55 mt-1 text-sm">
                  {item.courseTitle} ·{" "}
                  {new Date(item.enrolledAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
            ))}
            {details.recentEnrollments.length === 0 ? (
              <p className="text-foreground/60 py-8 text-center">
                لا توجد اشتراكات حديثة.
              </p>
            ) : null}
          </div>
        </div>

        <div className="glass-panel-strong rounded-xl p-5">
          <h2 className="text-lg font-black">الكوبونات الأكثر استخداما</h2>
          <div className="mt-4 space-y-3">
            {details.topCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/60 p-3"
              >
                <div>
                  <p className="font-black" dir="ltr">
                    {coupon.code}
                  </p>
                  <p className="text-foreground/55 mt-1 text-sm">
                    {coupon.courseTitle}
                  </p>
                </div>
                <span className="chip">
                  {coupon.usedCount.toLocaleString("ar-EG")} استخدام
                </span>
              </div>
            ))}
            {details.topCoupons.length === 0 ? (
              <p className="text-foreground/60 py-8 text-center">
                لا توجد كوبونات مستخدمة.
              </p>
            ) : null}
          </div>
        </div>

        <div className="glass-panel-strong rounded-xl p-5">
          <h2 className="text-lg font-black">متوسط التقييمات</h2>
          <div className="mt-4 space-y-3">
            {details.courseRatings.map((rating) => (
              <div key={rating.courseId} className="rounded-xl bg-white/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{rating.title}</p>
                  <span className="text-accent-700 font-black">
                    {rating.average.toFixed(1)} / 5
                  </span>
                </div>
                <p className="text-foreground/55 mt-1 text-sm">
                  {rating.count.toLocaleString("ar-EG")} تقييم
                </p>
              </div>
            ))}
            {details.courseRatings.length === 0 ? (
              <p className="text-foreground/60 py-8 text-center">
                لا توجد تقييمات بعد.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
