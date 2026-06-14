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
      <div
        className="card-modern animate-fade-up p-6"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">إدارة الكورسات</h2>
        </div>
        <p className="text-foreground/65 mt-3 leading-7">
          إدارة الكورسات والحصص والإحصائيات هتتضاف في Phase 4 بعد اكتمال واجهة
          الطلاب.
        </p>
      </div>
    </DashboardShell>
  );
}
