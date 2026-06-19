import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { getCurrentUserProfile, getRoleHomePath } from "@/lib/auth/roles";

import { DashboardAccountMenu } from "./dashboard-account-menu";

type DashboardShellProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export async function DashboardShell({
  title,
  eyebrow,
  children,
}: DashboardShellProps) {
  const session = await getCurrentUserProfile();
  const userRole = session?.profile.role ?? null;
  const dashboardHref = userRole ? getRoleHomePath(userRole) : null;

  return (
    <main className="relative min-h-screen">
      {/* Background decoration */}
      <div
        className="deco-circle"
        style={{
          width: 400,
          height: 400,
          top: -150,
          right: -100,
          background: "rgb(22 138 117 / 0.04)",
          position: "fixed",
        }}
      />

      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgb(255 255 255 / 0.82)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgb(208 227 218 / 0.5)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <Image
              src="/Logo/tamkeen-transparent.png"
              alt="شعار تمكين"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            />
            <span className="eyebrow text-xl whitespace-nowrap">تمكين</span>
          </Link>

          <DashboardAccountMenu
            userRole={userRole}
            dashboardHref={dashboardHref}
            userName={session?.profile.full_name ?? null}
            userEmail={session?.user.email ?? null}
            userAvatarUrl={session?.profile.avatar_url ?? null}
          />
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome banner */}
        <div
          className="animate-fade-up relative overflow-hidden rounded-2xl p-6"
          style={{
            background:
              "linear-gradient(135deg, rgb(22 138 117 / 0.06), rgb(245 197 24 / 0.04), rgb(22 138 117 / 0.03))",
            border: "1px solid rgb(22 138 117 / 0.1)",
          }}
        >
          <div
            className="deco-circle"
            style={{
              width: 200,
              height: 200,
              top: -80,
              left: -60,
              background: "rgb(22 138 117 / 0.06)",
            }}
          />
          <p className="eyebrow relative">{eyebrow}</p>
          <h1 className="heading-gradient relative mt-1 text-2xl font-bold sm:text-3xl">
            {title}
          </h1>
        </div>

        {children}
      </section>
    </main>
  );
}
