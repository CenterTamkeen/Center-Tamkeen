import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeacherSidebar } from "@/components/dashboard/teacher-sidebar";
import { requireRole } from "@/lib/auth/roles";

type TeacherLayoutProps = {
  children: ReactNode;
};

export default async function TeacherLayout({ children }: TeacherLayoutProps) {
  const { profile } = await requireRole("teacher", "/dashboard/teacher");

  return (
    <DashboardShell title={`أهلًا ${profile.full_name}`} eyebrow="لوحة المدرس">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <TeacherSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </DashboardShell>
  );
}
