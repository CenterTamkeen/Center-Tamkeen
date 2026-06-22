import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "الشروط والأحكام الخاصة باستخدام منصة تمكين، الحسابات، الكورسات، الاشتراكات، وحماية المحتوى التعليمي.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="الشروط"
      title="الشروط والأحكام"
      intro="باستخدام منصة تمكين، أنت توافق على قواعد استخدام الحسابات والكورسات والاشتراكات كما هو موضح هنا."
    >
      <StaticSection title="الحسابات">
        <p>
          الحساب شخصي ولا يجوز مشاركته. يحق للمنصة إيقاف الحساب عند إساءة
          الاستخدام أو محاولة تجاوز نظام الحماية.
        </p>
      </StaticSection>
      <StaticSection title="الكورسات والاشتراكات">
        <p>
          الاشتراك يتيح الوصول للكورس حسب سياسة المدرس والمنصة. كود التفعيل صالح
          للكورس المحدد فقط ولا يجوز مشاركته بعد استلامه.
        </p>
      </StaticSection>
      <StaticSection title="المحتوى">
        <p>
          محتوى الكورسات مملوك لأصحابه، ولا يسمح بإعادة نشره أو تسجيله أو توزيعه
          خارج المنصة.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
