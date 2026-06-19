import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NotificationItem =
  Database["public"]["Tables"]["notifications"]["Row"];

function logNotificationError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[notifications:${label}]`, error);
  }
}

function isMissingNotificationsTable(error: {
  message?: string;
  code?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("notifications") ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find")
  );
}

export async function getProfileNotifications(profileId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, recipient_profile_id, actor_profile_id, title, body, href, kind, read_at, created_at",
    )
    .eq("recipient_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingNotificationsTable(error)) {
      logNotificationError("list", error.message);
    }

    return [] as NotificationItem[];
  }

  return (data ?? []) as NotificationItem[];
}
