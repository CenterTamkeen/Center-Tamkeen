import type { Metadata } from "next";

import { AnnouncementManager } from "@/components/announcements/announcement-manager";
import { getTeacherAnnouncements } from "@/lib/announcements/data";
import { requireRole } from "@/lib/auth/roles";
import { getCurrentTeacher } from "@/lib/teacher/data";

export const metadata: Metadata = {
  title: "إعلانات المدرس",
};

export default async function TeacherAnnouncementsPage() {
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/announcements",
  );
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    return null;
  }

  const announcements = await getTeacherAnnouncements(teacher.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">الإعلانات</p>
        <h2 className="text-xl font-black">إعلانات الهيرو</h2>
      </div>
      <AnnouncementManager announcements={announcements} />
    </div>
  );
}
