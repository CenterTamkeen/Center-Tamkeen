import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export function StaticPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="heading-gradient mt-3 pb-2 text-4xl leading-[1.35] font-black sm:text-5xl sm:leading-[1.3]">
              {title}
            </h1>
            <p className="text-foreground/65 mt-5 text-lg leading-9">{intro}</p>
          </div>
          <div className="mt-10 grid gap-5">{children}</div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export function StaticSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-panel-strong rounded-xl p-5 sm:p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="text-foreground/65 mt-3 space-y-3 leading-8">
        {children}
      </div>
    </section>
  );
}
