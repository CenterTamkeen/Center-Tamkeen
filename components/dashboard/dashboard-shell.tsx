import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BackButton } from "@/components/navigation/back-button";
import { signOutAction } from "@/lib/auth/actions";

type DashboardShellProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export function DashboardShell({
  title,
  eyebrow,
  children,
}: DashboardShellProps) {
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/Logo/tamkeen-transparent.png"
              alt="شعار تمكين"
              width={44}
              height={44}
              className="h-10 w-10 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            />
            <span className="eyebrow text-xl">تمكين</span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <BackButton fallbackHref="/" label="رجوع" />
            <Link
              href="/profile"
              className="group text-primary-700 hover:bg-primary-50/60 flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all duration-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              الملف الشخصي
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="btn-secondary gap-1.5 px-3 py-2 text-xs"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                خروج
              </button>
            </form>
          </nav>
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
