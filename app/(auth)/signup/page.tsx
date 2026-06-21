import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { StudentSignUpForm } from "@/components/auth/student-signup-form";

export const metadata: Metadata = {
  title: "تسجيل طالب جديد",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="تسجيل طالب جديد"
      description="املأ بيانات الطالب الأساسية مرة واحدة، وبعدها تقدر تدخل على بوابة الطالب وتتابع الكورسات المفعلة."
      wide
    >
      <StudentSignUpForm />
    </AuthShell>
  );
}
