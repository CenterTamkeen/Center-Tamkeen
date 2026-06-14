import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "الملف الشخصي",
};

export default async function ProfilePage() {
  const { profile } = await requireUser("/profile");
  const supabase = await createClient();
  const { data: student } =
    profile.role === "student"
      ? await supabase
          .from("students")
          .select(
            "student_phone, father_phone, school_name, gender, grade, section",
          )
          .eq("profile_id", profile.id)
          .maybeSingle()
      : { data: null };

  return (
    <DashboardShell title="الملف الشخصي" eyebrow="بيانات الحساب">
      <div className="glass-panel rounded-lg p-5">
        <ProfileForm profile={profile} student={student} />
      </div>
    </DashboardShell>
  );
}
