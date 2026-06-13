import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

export default async function AdminDashboardPage() {
  const { profile } = await requireRole("admin", "/dashboard/admin");

  return (
    <DashboardShell title={`أهلًا ${profile.full_name}`} eyebrow="لوحة الإدارة">
      <div className="border-border bg-surface rounded-md border p-5">
        <h2 className="text-lg font-bold">إدارة تمكين</h2>
        <p className="text-foreground/70 mt-2 leading-7">
          إدارة المدرسين والطلبات والتقارير المالية هتتضاف في Phase 6.
        </p>
      </div>
    </DashboardShell>
  );
}
