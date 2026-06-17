"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/auth/action-state";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import { deleteImageByUrl, uploadImage } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTeacher } from "@/lib/teacher/data";
import {
  announcementCreateSchema,
  announcementUpdateSchema,
} from "@/lib/validations/announcement";

function failure(
  message: string,
  fieldErrors?: Record<string, string[]>,
  values?: Record<string, string>,
): ActionState {
  return {
    status: "error",
    message,
    fieldErrors,
    values,
  };
}

function success(message: string): ActionState {
  return {
    status: "success",
    message,
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getUpload(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : undefined;
}

function getOptionalUpload(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getFormValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, getString(formData, key)]));
}

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

async function getAnnouncementOwner() {
  const session = await getCurrentUserProfile();

  if (!session) {
    return {
      error: "لازم تسجل الدخول الأول.",
      profileId: null,
      ownerRole: null,
      teacherId: null,
    };
  }

  if (session.profile.role === "admin") {
    return {
      error: null,
      profileId: session.profile.id,
      ownerRole: "admin" as const,
      teacherId: null,
    };
  }

  if (session.profile.role === "teacher") {
    const teacher = await getCurrentTeacher(session.profile.id);

    if (!teacher) {
      return {
        error: "لا يوجد ملف مدرس مرتبط بحسابك.",
        profileId: null,
        ownerRole: null,
        teacherId: null,
      };
    }

    return {
      error: null,
      profileId: session.profile.id,
      ownerRole: "teacher" as const,
      teacherId: teacher.id,
    };
  }

  return {
    error: "الإعلانات متاحة للأدمن والمدرس فقط.",
    profileId: null,
    ownerRole: null,
    teacherId: null,
  };
}

function revalidateAnnouncementPaths() {
  revalidatePath("/");
  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/dashboard/teacher/announcements");
}

export async function createAnnouncementAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, ["title", "buttonText", "buttonUrl"]);
  const owner = await getAnnouncementOwner();

  if (
    owner.error ||
    !owner.profileId ||
    !owner.ownerRole ||
    (owner.ownerRole === "teacher" && !owner.teacherId)
  ) {
    return failure(
      owner.error ?? "تعذر تحديد صاحب الإعلان.",
      undefined,
      values,
    );
  }

  const parsed = announcementCreateSchema.safeParse({
    title: getString(formData, "title"),
    image: getUpload(formData, "image"),
    buttonText: getString(formData, "buttonText"),
    buttonUrl: getString(formData, "buttonUrl"),
    isActive: getCheckbox(formData, "isActive"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الإعلان.", fieldErrors(parsed.error), values);
  }

  let imageUrl: string;

  try {
    const upload = await uploadImage(parsed.data.image, {
      folder:
        owner.ownerRole === "teacher" && owner.teacherId
          ? `tamkeen/teachers/${owner.teacherId}/announcements`
          : "tamkeen/admin/announcements",
      publicId: `announcement-${Date.now()}`,
    });
    imageUrl = upload.secureUrl;
  } catch {
    return failure(
      "تعذر رفع صورة الإعلان.",
      { image: ["تعذر رفع صورة الإعلان."] },
      values,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hero_announcements").insert({
    created_by: owner.profileId,
    teacher_id: owner.teacherId,
    owner_role: owner.ownerRole,
    title: parsed.data.title,
    image_url: imageUrl,
    button_text: parsed.data.buttonText,
    button_url: parsed.data.buttonUrl,
    is_active: parsed.data.isActive ?? false,
  });

  if (error) {
    await deleteImageByUrl(imageUrl);
    return failure(
      "تعذر حفظ الإعلان. تأكد من تطبيق آخر migration.",
      undefined,
      values,
    );
  }

  revalidateAnnouncementPaths();
  return success("تم إنشاء الإعلان.");
}

export async function toggleAnnouncementActiveAction(formData: FormData) {
  const announcementId = getString(formData, "announcementId");
  const nextActive = getCheckbox(formData, "nextActive");
  const supabase = await createClient();

  if (!announcementId) {
    return;
  }

  await supabase
    .from("hero_announcements")
    .update({ is_active: nextActive })
    .eq("id", announcementId);

  revalidateAnnouncementPaths();
}

export async function updateAnnouncementAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = getFormValues(formData, [
    "announcementId",
    "title",
    "buttonText",
    "buttonUrl",
  ]);
  const owner = await getAnnouncementOwner();

  if (owner.error || !owner.profileId || !owner.ownerRole) {
    return failure(
      owner.error ?? "تعذر تحديد صاحب الإعلان.",
      undefined,
      values,
    );
  }

  const parsed = announcementUpdateSchema.safeParse({
    announcementId: getString(formData, "announcementId"),
    title: getString(formData, "title"),
    image: getOptionalUpload(formData, "image"),
    buttonText: getString(formData, "buttonText"),
    buttonUrl: getString(formData, "buttonUrl"),
    isActive: getCheckbox(formData, "isActive"),
  });

  if (!parsed.success) {
    return failure("راجع بيانات الإعلان.", fieldErrors(parsed.error), values);
  }

  const supabase = await createClient();
  const { data: currentAnnouncement } = await supabase
    .from("hero_announcements")
    .select("image_url")
    .eq("id", parsed.data.announcementId)
    .maybeSingle();

  let imageUrl: string | undefined;

  if (parsed.data.image && parsed.data.image.size > 0) {
    try {
      const upload = await uploadImage(parsed.data.image, {
        folder:
          owner.ownerRole === "teacher" && owner.teacherId
            ? `tamkeen/teachers/${owner.teacherId}/announcements`
            : "tamkeen/admin/announcements",
        publicId: `announcement-${Date.now()}`,
      });
      imageUrl = upload.secureUrl;
    } catch {
      return failure(
        "تعذر رفع صورة الإعلان.",
        { image: ["تعذر رفع صورة الإعلان."] },
        values,
      );
    }
  }

  const { error } = await supabase
    .from("hero_announcements")
    .update({
      title: parsed.data.title,
      button_text: parsed.data.buttonText,
      button_url: parsed.data.buttonUrl,
      is_active: parsed.data.isActive ?? false,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
    .eq("id", parsed.data.announcementId);

  if (error) {
    await deleteImageByUrl(imageUrl);
    return failure("تعذر حفظ تعديل الإعلان.", undefined, values);
  }

  if (imageUrl) {
    await deleteImageByUrl(currentAnnouncement?.image_url);
  }

  revalidateAnnouncementPaths();
  return success("تم حفظ تعديل الإعلان.");
}

export async function deleteAnnouncementAction(formData: FormData) {
  const announcementId = getString(formData, "announcementId");
  const supabase = await createClient();

  if (!announcementId) {
    return;
  }

  const { data: announcement } = await supabase
    .from("hero_announcements")
    .select("image_url")
    .eq("id", announcementId)
    .maybeSingle();

  const { error } = await supabase
    .from("hero_announcements")
    .delete()
    .eq("id", announcementId);

  if (!error) {
    await deleteImageByUrl(announcement?.image_url);
  }

  revalidateAnnouncementPaths();
}
