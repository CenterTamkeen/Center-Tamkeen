import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "تواصل مع دعم منصة تمكين للاستفسار عن الاشتراكات، أكواد التفعيل، حساب الطالب، أو كورسات الثانوية العامة.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="الدعم"
      title="تواصل معنا"
      intro="لو عندك مشكلة في الاشتراك، حسابك، أو محتاج تعرف تفاصيل أكتر عن تمكين، ابعتلنا وهنرد عليك في أقرب وقت."
    >
      <StaticSection title="قنوات التواصل">
        <p>
          الهاتف:{" "}
          <a
            href="tel:01111901562"
            className="text-primary-700 font-black hover:underline"
          >
            01111901562
          </a>
        </p>
        <p>
          البريد الإلكتروني:{" "}
          <a
            href="mailto:centertamkeen64@gmail.com"
            className="text-primary-700 font-black hover:underline"
          >
            centertamkeen64@gmail.com
          </a>
        </p>
        <p>
          فيسبوك:{" "}
          <a
            href="https://www.facebook.com/share/1b84HsBzqi/"
            target="_blank"
            rel="noreferrer"
            className="text-primary-700 font-black hover:underline"
          >
            صفحة تمكين على فيسبوك
          </a>
        </p>
        <p>مواعيد الدعم: يوميا من 10 صباحا حتى 10 مساء.</p>
      </StaticSection>
      <StaticSection title="قبل ما تراسلنا">
        <p>
          جهز اسم الحساب، رقم الهاتف، واسم الكورس أو المدرس المرتبط بالمشكلة
          عشان نقدر نساعدك بسرعة.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
