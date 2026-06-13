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
    <main className="bg-surface-muted min-h-screen px-4 py-8 sm:px-6">
      <section
        className={`border-border bg-surface mx-auto rounded-md border shadow-sm ${
          wide ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <div className="border-border border-b px-5 py-6 text-center sm:px-7">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-3"
          >
            <Image
              src="/Logo/tamkeen.png"
              alt="شعار تمكين"
              width={56}
              height={56}
              className="h-12 w-12 object-contain"
              priority
            />
            <span className="text-primary-700 text-2xl font-bold">تمكين</span>
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
