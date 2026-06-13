import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const roleHomePaths: Record<AppRole, string> = {
  student: "/dashboard/student",
  teacher: "/dashboard/teacher",
  admin: "/dashboard/admin",
};

export function getRoleHomePath(role: AppRole) {
  return roleHomePaths[role];
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return {
    user,
    profile,
  };
}

export async function requireUser(nextPath?: string) {
  const session = await getCurrentUserProfile();

  if (!session) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }

  return session;
}

export async function requireRole(role: AppRole, nextPath?: string) {
  const session = await requireUser(nextPath);

  if (session.profile.role !== role) {
    redirect(getRoleHomePath(session.profile.role));
  }

  return session;
}
