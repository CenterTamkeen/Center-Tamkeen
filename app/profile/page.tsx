import type { Metadata } from "next";
import Link from "next/link";

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
            "student_phone, father_phone, school_name, gender, grade, section, photo_url",
          )
          .eq("profile_id", profile.id)
          .maybeSingle()
      : { data: null };
  const { data: teacher } =
    profile.role === "teacher"
      ? await supabase
          .from("teachers")
          .select("subject, bio, avatar_url, cover_url, slug")
          .eq("profile_id", profile.id)
          .maybeSingle()
      : { data: null };

  return (
    <DashboardShell title="الملف الشخصي" eyebrow="بيانات الحساب">
      <div className="space-y-5">
        {profile.role === "admin" || profile.role === "teacher" ? (
          <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
            <div>
              <p className="eyebrow">إعلانات الهيرو</p>
              <h2 className="text-lg font-black">إدارة الإعلانات من حسابك</h2>
            </div>
            <Link
              href={
                profile.role === "admin"
                  ? "/dashboard/admin/announcements"
                  : "/dashboard/teacher/announcements"
              }
              className="btn-primary px-4 py-2.5 text-xs"
            >
              فتح الإعلانات
            </Link>
          </div>
        ) : null}

        <div
          className="card-modern animate-fade-up p-6"
          style={{ animationDelay: "0.1s" }}
        >
          <ProfileForm profile={profile} student={student} teacher={teacher} />
        </div>
      </div>
    </DashboardShell>
  );
}
