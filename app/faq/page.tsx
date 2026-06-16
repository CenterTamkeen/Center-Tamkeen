import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
};

const faqs = [
  [
    "إزاي أشترك في كورس؟",
    "افتح صفحة الكورس، اضغط اشتراك، واتبع خطوات الطلب حتى يتم التفعيل.",
  ],
  [
    "متى يظهر الكورس في حسابي؟",
    "بعد اعتماد الطلب من الإدارة يظهر الكورس في لوحة الطالب.",
  ],
  [
    "هل أقدر أغير كلمة المرور؟",
    "نعم من صفحة نسيت كلمة المرور أو إعدادات الحساب حسب حالتك.",
  ],
  [
    "ماذا أفعل لو الدفع لم يتفعل؟",
    "تواصل مع الدعم باسم الحساب ورقم الطلب أو مرجع الدفع.",
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
