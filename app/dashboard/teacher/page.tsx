import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "لوحة المدرس",
};

export default async function TeacherDashboardPage() {
  const { profile } = await requireRole("teacher", "/dashboard/teacher");

  return (
    <DashboardShell title={`أهلًا ${profile.full_name}`} eyebrow="لوحة المدرس">
      <div className="border-border bg-surface rounded-md border p-5">
        <h2 className="text-lg font-bold">إدارة الكورسات</h2>
        <p className="text-foreground/70 mt-2 leading-7">
          إدارة الكورسات والحصص والإحصائيات هتتضاف في Phase 4 بعد اكتمال واجهة
          الطلاب.
        </p>
      </div>
    </DashboardShell>
  );
}
