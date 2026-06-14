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
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">إدارة تمكين</h2>
        </div>
        <p className="text-foreground/65 mt-3 leading-7">
          إدارة المدرسين والطلبات والتقارير المالية هتتضاف في Phase 6.
        </p>
      </div>
    </DashboardShell>
  );
}
