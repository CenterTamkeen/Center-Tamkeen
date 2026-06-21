"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Mark all unread notifications as read for the current user.
 * Sets `read_at` to `now()` on every notification where `read_at IS NULL`.
 */
export async function markNotificationsAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_profile_id", user.id)
    .is("read_at", null);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications:markAsRead]", error.message);
    }
    return;
  }

  revalidatePath("/", "layout");
}
