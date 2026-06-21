import type { Metadata } from "next";

import { NotificationComposer } from "@/components/dashboard/notification-composer";
import { requireRole } from "@/lib/auth/roles";
import { getTeacherNotificationCourses } from "@/lib/notifications/data";
import { getCurrentTeacher } from "@/lib/teacher/data";

export const metadata: Metadata = {
  title: "إشعارات الطلاب",
};

export default async function TeacherNotificationsPage() {
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/notifications",
  );
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    return null;
  }

  const courses = await getTeacherNotificationCourses(teacher.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">الإشعارات</p>
        <h2 className="text-xl font-black">إرسال إشعار لطلابك</h2>
      </div>

      <NotificationComposer role="teacher" courses={courses} />
    </div>
  );
}
