import type { Metadata } from "next";

import { CouponManager } from "@/components/teacher/coupon-manager";
import { requireRole } from "@/lib/auth/roles";
import { getCurrentTeacher, getTeacherCoupons } from "@/lib/teacher/data";

export const metadata: Metadata = {
  title: "كوبونات المدرس",
};

export default async function TeacherCouponsPage() {
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/coupons",
  );
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    return null;
  }

  const coupons = await getTeacherCoupons(teacher.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">الكوبونات</p>
        <h2 className="text-xl font-black">إدارة كوبونات الخصم</h2>
      </div>
      <CouponManager coupons={coupons} />
    </div>
  );
}
