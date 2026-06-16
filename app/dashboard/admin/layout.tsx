import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth/roles";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = await requireRole("admin", "/dashboard/admin");

  return (
    <DashboardShell title={`أهلًا ${profile.full_name}`} eyebrow="لوحة الإدارة">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </DashboardShell>
  );
}
