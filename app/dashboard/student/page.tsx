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
      <div className="card-modern p-5">
        <h2 className="text-lg font-bold">كورساتي</h2>
        <p className="text-foreground/70 mt-2 leading-7">
          هنا هتظهر الكورسات المشترك بها الطالب بعد تفعيل الدفع في المراحل
          القادمة.
        </p>
      </div>
    </DashboardShell>
  );
}
