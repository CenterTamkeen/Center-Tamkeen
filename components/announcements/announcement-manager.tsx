"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementActiveAction,
  updateAnnouncementAction,
} from "@/lib/announcements/actions";
import type { HeroAnnouncement } from "@/lib/announcements/data";
import { initialActionState } from "@/lib/auth/action-state";

import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";

function ownerLabel(announcement: HeroAnnouncement) {
  if (announcement.owner_role === "admin") {
    return "إعلان الإدارة";
  }

  return announcement.teacher?.profile?.full_name
    ? `إعلان ${announcement.teacher.profile.full_name}`
    : "إعلان مدرس";
}

function CreateAnnouncementForm() {
  const [state, formAction, isPending] = useActionState(
    createAnnouncementAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="card-modern space-y-5 p-5">
      <FormFeedback state={state} />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 lg:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            اسم الإعلان داخل الداشبورد
          </span>
          <input
            name="title"
            defaultValue={state.values?.title ?? ""}
            className="field bg-background/60 py-2.5"
            placeholder="مثال: إعلان مراجعة الفيزياء"
          />
          <ErrorText message={state.fieldErrors?.title?.[0]} />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-foreground/80 text-sm font-semibold">
            صورة الإعلان
          </span>
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="bg-background/60 focus:border-primary-400 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-300 file:ml-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:font-bold focus:shadow-[0_0_0_4px_rgb(22_138_117/0.08)]"
          />
          <p className="text-foreground/50 text-xs leading-5 font-semibold">
            المقاس المقترح للبانر: 1600 × 700 بكسل بنسبة 16:7. اترك الكلام المهم
            في منتصف التصميم. JPG/PNG/WebP بحد أقصى 5MB.
          </p>
          <ErrorText message={state.fieldErrors?.image?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الكلام على الزرار
          </span>
          <input
            name="buttonText"
            defaultValue={state.values?.buttonText ?? ""}
            className="field bg-background/60 py-2.5"
            placeholder="احجز الآن"
          />
          <ErrorText message={state.fieldErrors?.buttonText?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            لينك الزرار
          </span>
          <input
            name="buttonUrl"
            defaultValue={state.values?.buttonUrl ?? ""}
            className="field bg-background/60 py-2.5 text-left"
            dir="ltr"
            placeholder="/courses أو https://..."
          />
          <ErrorText message={state.fieldErrors?.buttonUrl?.[0]} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked
            className="accent-primary-600 h-4 w-4"
          />
          نشر الإعلان في الهيرو
        </label>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "جاري الإضافة..." : "إضافة إعلان"}
        </button>
      </div>
    </form>
  );
}

function EditAnnouncementForm({
  announcement,
  onCancel,
}: {
  announcement: HeroAnnouncement;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateAnnouncementAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white/60 p-4">
      <input type="hidden" name="announcementId" value={announcement.id} />
      <FormFeedback state={state} />

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          اسم الإعلان داخل الداشبورد
        </span>
        <input
          name="title"
          defaultValue={state.values?.title ?? announcement.title}
          className="field bg-background/60 py-2.5"
        />
        <ErrorText message={state.fieldErrors?.title?.[0]} />
      </label>

      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          تغيير صورة الإعلان
        </span>
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="bg-background/60 focus:border-primary-400 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-300 file:ml-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:font-bold focus:shadow-[0_0_0_4px_rgb(22_138_117/0.08)]"
        />
        <p className="text-foreground/50 text-xs leading-5 font-semibold">
          المقاس المقترح للبانر: 1600 × 700 بكسل بنسبة 16:7. JPG/PNG/WebP بحد
          أقصى 5MB.
        </p>
        <ErrorText message={state.fieldErrors?.image?.[0]} />
      </label>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            الكلام على الزرار
          </span>
          <input
            name="buttonText"
            defaultValue={state.values?.buttonText ?? announcement.button_text}
            className="field bg-background/60 py-2.5"
          />
          <ErrorText message={state.fieldErrors?.buttonText?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-foreground/80 text-sm font-semibold">
            لينك الزرار
          </span>
          <input
            name="buttonUrl"
            defaultValue={state.values?.buttonUrl ?? announcement.button_url}
            className="field bg-background/60 py-2.5 text-left"
            dir="ltr"
          />
          <ErrorText message={state.fieldErrors?.buttonUrl?.[0]} />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={announcement.is_active}
            className="accent-primary-600 h-4 w-4"
          />
          نشر الإعلان في الهيرو
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary px-3 py-2 text-xs"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary px-3 py-2 text-xs"
          >
            {isPending ? "جاري الحفظ..." : "حفظ التعديل"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function AnnouncementManager({
  announcements,
}: {
  announcements: HeroAnnouncement[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <CreateAnnouncementForm />

      <div className="grid gap-4 xl:grid-cols-2">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="glass-panel-strong overflow-hidden rounded-xl"
            >
              <div className="bg-primary-50 relative aspect-[16/7]">
                <Image
                  src={announcement.image_url}
                  alt={announcement.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 560px"
                  className="object-cover"
                />
                <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-primary-900 rounded-xl bg-white/92 px-4 py-2 text-sm font-black shadow-[var(--shadow-card)]">
                    {announcement.button_text}
                  </span>
                  <span className="rounded-xl bg-black/45 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                    {announcement.is_active ? "ظاهر" : "مخفي"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <h3 className="font-black">{announcement.title}</h3>
                  <p className="text-foreground/55 mt-1 text-sm">
                    {ownerLabel(announcement)}
                  </p>
                  <p
                    className="text-foreground/45 mt-1 truncate text-xs"
                    dir="ltr"
                  >
                    {announcement.button_url}
                  </p>
                </div>

                {editingId === announcement.id ? (
                  <EditAnnouncementForm
                    announcement={announcement}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(announcement.id)}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      تعديل
                    </button>
                    <form action={toggleAnnouncementActiveAction}>
                      <input
                        type="hidden"
                        name="announcementId"
                        value={announcement.id}
                      />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={announcement.is_active ? "false" : "true"}
                      />
                      <button className="btn-secondary px-3 py-2 text-xs">
                        {announcement.is_active ? "إخفاء" : "نشر"}
                      </button>
                    </form>

                    <form action={deleteAnnouncementAction}>
                      <input
                        type="hidden"
                        name="announcementId"
                        value={announcement.id}
                      />
                      <button
                        type="submit"
                        className="btn-secondary px-3 py-2 text-xs text-red-700"
                        onClick={(event) => {
                          if (!confirm("هل تريد حذف الإعلان؟")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        حذف
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center xl:col-span-2">
            لا توجد إعلانات حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
