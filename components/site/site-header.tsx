import { getCurrentUserProfile, getRoleHomePath } from "@/lib/auth/roles";
import { getProfileNotifications } from "@/lib/notifications/data";

import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const session = await getCurrentUserProfile();
  const userRole = session?.profile.role ?? null;
  const dashboardHref = userRole ? getRoleHomePath(userRole) : null;
  const notifications = session?.profile.id
    ? await getProfileNotifications(session.profile.id, 5)
    : [];

  return (
    <SiteHeaderClient
      userRole={userRole}
      dashboardHref={dashboardHref}
      userName={session?.profile.full_name ?? null}
      userEmail={session?.user.email ?? null}
      userAvatarUrl={session?.profile.avatar_url ?? null}
      notifications={notifications}
    />
  );
}
