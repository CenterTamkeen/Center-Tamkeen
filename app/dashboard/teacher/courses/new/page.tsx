import type { Metadata } from "next";

import { CourseForm } from "@/components/teacher/course-form";

export const metadata: Metadata = {
  title: "كورس جديد",
};

export default function NewCoursePage() {
  return (
    <div className="card-modern p-6">
      <p className="eyebrow">كورس جديد</p>
      <h2 className="mb-5 text-xl font-black">إنشاء كورس</h2>
      <CourseForm />
    </div>
  );
}
