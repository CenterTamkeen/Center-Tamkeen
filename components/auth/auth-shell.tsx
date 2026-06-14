import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
};

export function AuthShell({
  title,
  description,
  children,
  wide = false,
}: AuthShellProps) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section
        className={`glass-panel animate-fade-up mx-auto overflow-hidden rounded-lg ${
          wide ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <div className="border-border/70 bg-surface/60 border-b px-5 py-6 text-center sm:px-7">
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-3"
          >
            <Image
              src="/Logo/tamkeen.png"
              alt="شعار تمكين"
              width={56}
              height={56}
              className="h-12 w-12 object-contain transition duration-300 group-hover:scale-105"
              priority
            />
            <span className="text-primary-700 text-2xl font-black">تمكين</span>
          </Link>

          <h1 className="mt-5 text-2xl leading-tight font-black sm:text-3xl">
            {title}
          </h1>
          <p className="text-foreground/65 mx-auto mt-3 max-w-2xl leading-7">
            {description}
          </p>
        </div>

        <div className="px-5 py-6 sm:px-7">{children}</div>
      </section>
    </main>
  );
}
