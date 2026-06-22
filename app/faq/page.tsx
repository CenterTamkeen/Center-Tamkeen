import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description:
    "إجابات سريعة عن الاشتراك في كورسات منصة تمكين، أكواد التفعيل، حساب الطالب، والدعم.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  [
    "إزاي أشترك في كورس؟",
    "افتح صفحة الكورس، تواصل مع فريق تمكين للدفع، وبعد التأكيد هتاخد كود تفعيل خاص بالكورس.",
  ],
  [
    "متى يظهر الكورس في حسابي؟",
    "بمجرد إدخال كود التفعيل الصحيح في صفحة الكورس، يظهر الكورس في لوحة الطالب فورًا.",
  ],
  [
    "هل أقدر أغير كلمة المرور؟",
    "نعم من صفحة نسيت كلمة المرور أو إعدادات الحساب حسب حالتك.",
  ],
  [
    "ماذا أفعل لو الدفع لم يتفعل؟",
    "تواصل مع الدعم باسم الحساب والكورس المطلوب، والفريق هيراجع الدفع ويوفر لك كود التفعيل.",
  ],
];

export default function FaqPage() {
  return (
    <StaticPageShell
      eyebrow="مساعدة"
      title="الأسئلة الشائعة"
      intro="إجابات سريعة على أكثر الأسئلة المتكررة من الطلاب وأولياء الأمور."
    >
      {faqs.map(([question, answer]) => (
        <StaticSection key={question} title={question}>
          <p>{answer}</p>
        </StaticSection>
      ))}
    </StaticPageShell>
  );
}
