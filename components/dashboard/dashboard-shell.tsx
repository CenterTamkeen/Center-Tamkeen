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
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Logo/tamkeen.png"
              alt="شعار تمكين"
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
            />
            <span className="text-primary-700 text-xl font-bold">تمكين</span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/profile" className="text-primary-700">
              الملف الشخصي
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="border-border hover:bg-surface-muted rounded-md border px-3 py-2 transition"
              >
                خروج
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <p className="text-primary-700 text-sm font-bold">{eyebrow}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        </div>

        {children}
      </section>
    </main>
  );
}
