import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "بوابة الطالب",
};

export default async function StudentDashboardPage() {
  const { profile } = await requireRole("student", "/dashboard/student");

  return (
    <DashboardShell title={`أهلًا ${profile.full_name}`} eyebrow="بوابة الطالب">
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
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">كورساتي</h2>
        </div>
        <p className="text-foreground/65 mt-3 leading-7">
          هنا هتظهر الكورسات المشترك بها الطالب بعد تفعيل الدفع في المراحل
          القادمة.
        </p>
      </div>
    </DashboardShell>
  );
}
