"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.error("Supabase admin client is not configured.", error);
    return null;
  }
}

async function getTeacherId(profileId: string) {
  const admin = getAdminClient();

  if (!admin) {
    return null;
  }

  const { data } = await admin
    .from("teachers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  return data?.id ?? null;
}

async function teacherCanManageStudent(teacherId: string, studentId: string) {
  const admin = getAdminClient();

  if (!admin) {
    return false;
  }

  const { data } = await admin
    .from("enrollments")
    .select("id, course:courses!inner(teacher_id)")
    .eq("student_id", studentId)
    .eq("course.teacher_id", teacherId)
    .limit(1);

  return (data ?? []).length > 0;
}

export async function blockStudentAction(formData: FormData) {
  const { profile } = await requireUser();
  const studentId = getString(formData, "studentId");
  const reason = getString(formData, "reason").trim() || null;
  const admin = getAdminClient();

  if (!admin || !studentId) {
    return;
  }

  if (profile.role === "admin") {
    await admin.from("student_blocks").upsert(
      {
        student_id: studentId,
        teacher_id: null,
        blocked_by: profile.id,
        reason,
      },
      { onConflict: "student_id,teacher_id" },
    );
    revalidatePath("/dashboard/admin/students");
    return;
  }

  if (profile.role === "teacher") {
    const teacherId = await getTeacherId(profile.id);

    if (!teacherId || !(await teacherCanManageStudent(teacherId, studentId))) {
      return;
    }

    await admin.from("student_blocks").upsert(
      {
        student_id: studentId,
        teacher_id: teacherId,
        blocked_by: profile.id,
        reason,
      },
      { onConflict: "student_id,teacher_id" },
    );
    revalidatePath("/dashboard/teacher/students");
  }
}

export async function unblockStudentAction(formData: FormData) {
  const { profile } = await requireUser();
  const studentId = getString(formData, "studentId");
  const admin = getAdminClient();

  if (!admin || !studentId) {
    return;
  }

  if (profile.role === "admin") {
    await admin
      .from("student_blocks")
      .delete()
      .eq("student_id", studentId)
      .is("teacher_id", null);
    revalidatePath("/dashboard/admin/students");
    return;
  }

  if (profile.role === "teacher") {
    const teacherId = await getTeacherId(profile.id);

    if (!teacherId) {
      return;
    }

    await admin
      .from("student_blocks")
      .delete()
      .eq("student_id", studentId)
      .eq("teacher_id", teacherId);
    revalidatePath("/dashboard/teacher/students");
  }
}
