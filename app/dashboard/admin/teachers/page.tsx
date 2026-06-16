import type { Metadata } from "next";

import { AdminTeachersTable } from "@/components/admin/admin-teachers-table";
import { TeacherCreateForm } from "@/components/admin/teacher-create-form";
import { getAdminTeachers } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: "إدارة المدرسين",
};

export default async function AdminTeachersPage() {
  const teachers = await getAdminTeachers();

  return (
    <div className="space-y-6">
      <TeacherCreateForm />

      <section className="space-y-4">
        <div>
          <p className="eyebrow">المدرسين</p>
          <h2 className="text-xl font-black">حسابات المدرسين</h2>
        </div>

        {teachers.length > 0 ? (
          <AdminTeachersTable teachers={teachers} />
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد حسابات مدرسين حتى الآن.
          </div>
        )}
      </section>
    </div>
  );
}
