import { getCurrentUserProfile, getRoleHomePath } from "@/lib/auth/roles";

import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const session = await getCurrentUserProfile();
  const userRole = session?.profile.role ?? null;
  const dashboardHref = userRole ? getRoleHomePath(userRole) : null;

  return <SiteHeaderClient userRole={userRole} dashboardHref={dashboardHref} />;
}
