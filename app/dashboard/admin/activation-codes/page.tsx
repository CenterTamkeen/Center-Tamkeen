import type { Metadata } from "next";

import { ActivationCodeManager } from "@/components/admin/activation-code-manager";
import { getAdminActivationCodes, getAdminCourses } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: "أكواد التفعيل",
};

export default async function AdminActivationCodesPage() {
  const [courses, codes] = await Promise.all([
    getAdminCourses(),
    getAdminActivationCodes(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">أكواد التفعيل</p>
        <h2 className="text-xl font-black">توليد ومتابعة أكواد الكورسات</h2>
      </div>

      <ActivationCodeManager courses={courses} codes={codes} />
    </div>
  );
}
