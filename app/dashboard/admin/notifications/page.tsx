import type { Metadata } from "next";

import { NotificationComposer } from "@/components/dashboard/notification-composer";
import { getAdminNotificationCourses } from "@/lib/notifications/data";

export const metadata: Metadata = {
  title: "إرسال الإشعارات",
};

export default async function AdminNotificationsPage() {
  const courses = await getAdminNotificationCourses();

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">الإشعارات</p>
        <h2 className="text-xl font-black">إرسال إشعار للطلاب</h2>
      </div>

      <NotificationComposer role="admin" courses={courses} />
    </div>
  );
}
