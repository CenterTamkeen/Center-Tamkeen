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
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      {/* Animated background */}
      <div
        className="deco-circle animate-float-soft"
        style={{
          width: 600,
          height: 600,
          top: -200,
          right: -200,
          background: "rgb(22 138 117 / 0.06)",
        }}
      />
      <div
        className="deco-circle animate-float-soft"
        style={{
          width: 400,
          height: 400,
          bottom: -150,
          left: -100,
          background: "rgb(245 197 24 / 0.06)",
          animationDelay: "3s",
        }}
      />
      <div
        className="deco-circle"
        style={{
          width: 200,
          height: 200,
          top: "50%",
          left: "70%",
          background: "rgb(22 138 117 / 0.03)",
        }}
      />

      <section
        className={`animate-blur-in glass-panel-strong relative mx-auto overflow-hidden rounded-2xl ${
          wide ? "max-w-4xl" : "max-w-md"
        }`}
      >
        {/* Top gradient accent */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--primary-400), var(--accent-400), var(--primary-400))",
            backgroundSize: "200% 100%",
            animation: "gradient-x 3s ease infinite",
          }}
        />

        <div
          className="border-b px-6 py-7 text-center sm:px-8"
          style={{
            borderColor: "rgb(208 227 218 / 0.4)",
            background: "rgb(255 255 255 / 0.4)",
          }}
        >
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-3"
          >
            <Image
              src="/Logo/tamkeen-transparent.png"
              alt="شعار تمكين"
              width={56}
              height={56}
              className="h-12 w-12 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              priority
            />
            <span className="eyebrow text-2xl">تمكين</span>
          </Link>

          <h1 className="heading-gradient mt-6 text-2xl leading-tight font-black sm:text-3xl">
            {title}
          </h1>
          <p className="text-foreground/60 mx-auto mt-3 max-w-2xl leading-7">
            {description}
          </p>
        </div>

        <div className="px-6 py-7 sm:px-8">{children}</div>
      </section>
    </main>
  );
}
