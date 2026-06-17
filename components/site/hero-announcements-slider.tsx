"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { HeroAnnouncement } from "@/lib/announcements/data";

const announcementSlots = [
  {
    owner: "إعلان السنتر",
    title: "مساحة إعلان رئيسية",
    accent: "bg-primary-500",
  },
  {
    owner: "إعلان المدرس",
    title: "مساحة إعلان للمدرس",
    accent: "bg-accent-500",
  },
  {
    owner: "إعلان الإدارة",
    title: "مساحة إعلان للإدارة",
    accent: "bg-info",
  },
];

function getOwnerLabel(announcement: HeroAnnouncement) {
  if (announcement.owner_role === "admin") {
    return "إعلان تمكين";
  }

  return announcement.teacher?.profile?.full_name
    ? `إعلان ${announcement.teacher.profile.full_name}`
    : "إعلان مدرس";
}

export function HeroAnnouncementsSlider({
  announcements,
}: {
  announcements: HeroAnnouncement[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasAnnouncements = announcements.length > 0;
  const activeAnnouncement = hasAnnouncements
    ? announcements[activeIndex % announcements.length]
    : null;
  const activeSlot = announcementSlots[activeIndex % announcementSlots.length];
  const slideCount = hasAnnouncements
    ? announcements.length
    : announcementSlots.length;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [slideCount]);

  function goToPrevious() {
    setActiveIndex((current) => (current === 0 ? slideCount - 1 : current - 1));
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % slideCount);
  }

  return (
    <section
      className="border-primary-200 relative min-h-[470px] overflow-hidden rounded-2xl border border-dashed bg-white p-5 shadow-[var(--shadow-card)] transition-colors duration-500 sm:p-6"
      aria-label="عروض وإعلانات تمكين"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(231_245_241/0.5),transparent_42%),linear-gradient(315deg,rgb(254_248_224/0.55),transparent_38%)]" />
      <div className="relative z-10 flex min-h-[430px] flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="chip bg-white/80">
            {activeAnnouncement
              ? getOwnerLabel(activeAnnouncement)
              : activeSlot.owner}
          </span>
          <div className="flex items-center gap-2" dir="ltr">
            <button
              type="button"
              onClick={goToPrevious}
              className="text-primary-800 border-primary-100 hover:border-primary-200 flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-lg font-black shadow-sm transition-all duration-300 hover:-translate-y-0.5"
              aria-label="الإعلان السابق"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="text-primary-800 border-primary-100 hover:border-primary-200 flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-lg font-black shadow-sm transition-all duration-300 hover:-translate-y-0.5"
              aria-label="الإعلان التالي"
            >
              ›
            </button>
          </div>
        </div>

        {activeAnnouncement ? (
          <div className="grid flex-1 py-6">
            <div className="border-primary-100 relative min-h-[350px] overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-card)]">
              <Image
                key={activeAnnouncement.id}
                src={activeAnnouncement.image_url}
                alt={activeAnnouncement.title}
                fill
                sizes="(max-width: 1024px) 100vw, 580px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-x-5 bottom-5 flex justify-center">
                <Link
                  href={activeAnnouncement.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent-500 text-accent-foreground hover:bg-accent-400 inline-flex min-w-36 items-center justify-center rounded-xl px-5 py-3 text-sm font-black shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-1"
                >
                  {activeAnnouncement.button_text}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center py-10">
            <div className="w-full max-w-md space-y-7 text-center">
              <div className="border-primary-100 relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-card)]">
                <div className="border-primary-200 absolute inset-5 rounded-xl border border-dashed bg-[linear-gradient(135deg,rgb(245_250_248/0.95),rgb(255_255_255/0.92))]" />
                <div
                  className={`absolute top-8 right-8 h-3 w-28 rounded-full ${activeSlot.accent}`}
                />
                <div className="bg-primary-100 absolute top-16 right-8 h-3 w-44 rounded-full" />
                <div className="bg-primary-100/70 absolute top-24 right-8 h-3 w-32 rounded-full" />
                <div className="bg-accent-100 absolute bottom-8 left-8 h-12 w-28 rounded-xl" />
                <div className="bg-primary-100 absolute right-8 bottom-8 h-12 w-12 rounded-xl" />
              </div>
              <div>
                <h2 className="text-primary-950 text-3xl leading-tight font-black">
                  {activeSlot.title}
                </h2>
                <p className="text-foreground/55 mx-auto mt-3 max-w-sm text-sm leading-7 font-semibold">
                  سيتم عرض الإعلان هنا بعد إضافته من لوحة التحكم.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2" dir="ltr">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "bg-primary-600 w-8"
                  : "bg-primary-200 w-2"
              }`}
              aria-label={`مساحة إعلان ${index + 1}`}
              aria-pressed={activeIndex === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
