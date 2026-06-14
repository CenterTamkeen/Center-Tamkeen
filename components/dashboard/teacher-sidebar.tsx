"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/dashboard/teacher",
    label: "الإحصائيات",
    icon: <path d="M12 20V10M18 20V4M6 20v-4" />,
  },
  {
    href: "/dashboard/teacher/courses",
    label: "الكورسات",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </>
    ),
  },
  {
    href: "/dashboard/teacher/coupons",
    label: "الكوبونات",
    icon: (
      <>
        <path d="M3 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
        <path d="M13 5v14" />
      </>
    ),
  },
  {
    href: "/profile",
    label: "الملف الشخصي",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel-strong rounded-xl p-3 lg:sticky lg:top-24">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard/teacher" &&
              pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black transition-all duration-300",
                active
                  ? "bg-primary-50 text-primary-700 shadow-[inset_0_0_0_1px_rgb(22_138_117/0.14)]"
                  : "text-foreground/65 hover:bg-primary-50/50 hover:text-primary-700",
              )}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {link.icon}
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
