import { redirect } from "next/navigation";

import { getRoleHomePath, requireUser } from "@/lib/auth/roles";

export default async function DashboardPage() {
  const { profile } = await requireUser("/dashboard");
  redirect(getRoleHomePath(profile.role));
}
