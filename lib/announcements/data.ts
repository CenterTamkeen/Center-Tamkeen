import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AnnouncementRow =
  Database["public"]["Tables"]["hero_announcements"]["Row"];

export type HeroAnnouncement = Pick<
  AnnouncementRow,
  | "id"
  | "owner_role"
  | "title"
  | "image_url"
  | "button_text"
  | "button_url"
  | "is_active"
  | "created_at"
> & {
  teacher: {
    subject: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
};

function logAnnouncementError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[announcements:${label}]`, error);
  }
}

function isMissingAnnouncementsTable(error: {
  message?: string;
  code?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("hero_announcements") ||
    error.message?.includes("schema cache")
  );
}

export async function getPublicHeroAnnouncements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hero_announcements")
    .select(
      "id, owner_role, title, image_url, button_text, button_url, is_active, created_at, teacher:teachers(subject, profile:profiles(full_name))",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingAnnouncementsTable(error)) {
      return [];
    }

    logAnnouncementError("public-hero", error.message);
    return [];
  }

  return (data ?? []) as HeroAnnouncement[];
}

export async function getAdminAnnouncements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hero_announcements")
    .select(
      "id, owner_role, title, image_url, button_text, button_url, is_active, created_at, teacher:teachers(subject, profile:profiles(full_name))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingAnnouncementsTable(error)) {
      return [];
    }

    logAnnouncementError("admin", error.message);
    return [];
  }

  return (data ?? []) as HeroAnnouncement[];
}

export async function getTeacherAnnouncements(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hero_announcements")
    .select(
      "id, owner_role, title, image_url, button_text, button_url, is_active, created_at, teacher:teachers(subject, profile:profiles(full_name))",
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingAnnouncementsTable(error)) {
      return [];
    }

    logAnnouncementError("teacher", error.message);
    return [];
  }

  return (data ?? []) as HeroAnnouncement[];
}
