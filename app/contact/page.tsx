import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "تواصل معنا",
};

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="الدعم"
      title="تواصل معنا"
      intro="لو عندك مشكلة في الاشتراك، حسابك، أو محتاج تعرف تفاصيل أكتر عن تمكين، ابعتلنا وهنرد عليك في أقرب وقت."
    >
      <StaticSection title="قنوات التواصل">
        <p>الهاتف: يتم إضافته من إدارة المنصة.</p>
        <p>البريد الإلكتروني: support@center-tamkeen.com</p>
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
