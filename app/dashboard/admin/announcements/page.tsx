import type { Metadata } from "next";

import { AnnouncementManager } from "@/components/announcements/announcement-manager";
import { getAdminAnnouncements } from "@/lib/announcements/data";

export const metadata: Metadata = {
  title: "إعلانات الهيرو",
};

export default async function AdminAnnouncementsPage() {
  const announcements = await getAdminAnnouncements();

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
