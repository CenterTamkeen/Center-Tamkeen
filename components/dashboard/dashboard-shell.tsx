import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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
    <main className="min-h-screen">
      <header className="border-border/70 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/Logo/tamkeen.png"
              alt="شعار تمكين"
              width={44}
              height={44}
              className="h-10 w-10 object-contain transition duration-300 group-hover:scale-105"
            />
            <span className="text-primary-700 text-xl font-black">تمكين</span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link
              href="/profile"
              className="text-primary-700 hover:text-primary-900 transition"
            >
              الملف الشخصي
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary px-3 py-2">
                خروج
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-lg p-5">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        </div>

        {children}
      </section>
    </main>
  );
}
