"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/dashboard/admin",
    label: "النظرة العامة",
    icon: <path d="M12 20V10M18 20V4M6 20v-4" />,
  },
  {
    href: "/dashboard/admin/teachers",
    label: "المدرسين",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    href: "/dashboard/admin/courses",
    label: "الكورسات",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </>
    ),
  },
  {
    href: "/dashboard/admin/orders",
    label: "الطلبات",
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    href: "/dashboard/admin/announcements",
    label: "الإعلانات",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 15l3-3 2 2 3-4 2 3" />
      </>
    ),
  },
  {
    href: "/dashboard/admin/students",
    label: "الطلاب",
    icon: (
      <>
        <path d="M18 21a6 6 0 0 0-12 0" />
        <circle cx="12" cy="8" r="4" />
      </>
    ),
  },
  {
    href: "/dashboard/admin/reports",
    label: "التقارير",
    icon: (
      <>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </>
    ),
  },
  {
    href: "/dashboard/admin/reviews",
    label: "التقييمات",
    icon: (
      <>
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel-strong rounded-xl p-3 lg:sticky lg:top-24">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard/admin" &&
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
