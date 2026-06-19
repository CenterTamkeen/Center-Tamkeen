import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/navigation/back-button";
import { ProfileForm } from "@/components/profile/profile-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { signOutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "الملف الشخصي",
};

export default async function ProfilePage() {
  const { profile, user } = await requireUser("/profile");
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
    <>
      <SiteHeader />
      <main>
        <section
          className="relative overflow-hidden border-b"
          style={{
            borderColor: "var(--footer-border)",
            background: "var(--panel-wash-background)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            className="deco-circle"
            style={{
              width: 300,
              height: 300,
              top: -100,
              left: -100,
              background: "rgb(22 138 117 / 0.05)",
            }}
          />

          <div className="container-page relative py-10 sm:py-14">
            <BackButton
              fallbackHref="/"
              label="رجوع للرئيسية"
              className="mb-5"
            />
            <div className="animate-fade-up">
              <p className="eyebrow">بيانات الحساب</p>
              <h1 className="heading-gradient mt-2 text-3xl font-black sm:text-4xl">
                الملف الشخصي
              </h1>
            </div>
          </div>
        </section>

        <section className="container-page space-y-5 py-8">
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
            <ProfileForm
              profile={profile}
              student={student}
              teacher={teacher}
              email={user.email}
            />
          </div>

          <form action={signOutAction} className="flex justify-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-700/15 bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-900/15 focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:outline-none sm:w-auto"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              تسجيل الخروج
            </button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
