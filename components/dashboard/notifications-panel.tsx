"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { markNotificationsAsRead } from "@/lib/notifications/actions";
import type { NotificationItem } from "@/lib/notifications/data";

type NotificationsPanelProps = {
  notifications: NotificationItem[];
};

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const [markedRead, setMarkedRead] = useState(false);
  const [isPending, startTransition] = useTransition();
  const serverUnread = notifications.filter((item) => !item.read_at).length;
  const unreadCount = markedRead ? 0 : serverUnread;

  function handleMarkAllRead() {
    setMarkedRead(true);
    startTransition(() => {
      markNotificationsAsRead();
    });
  }

  return (
    <section className="glass-panel-strong rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">الإشعارات</p>
          <h2 className="text-xl font-black">آخر التنبيهات</h2>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleMarkAllRead}
            className="bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-full px-3 py-1 text-xs font-black transition-colors disabled:opacity-50"
          >
            تعليم الكل كمقروء
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((item) => {
            const content = (
              <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 transition hover:border-emerald-200 hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black">{item.title}</p>
                    <p className="text-foreground/60 mt-1 text-sm leading-6">
                      {item.body}
                    </p>
                  </div>
                  {!item.read_at && !markedRead ? (
                    <span className="bg-primary-500 mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                  ) : null}
                </div>
                <p className="text-foreground/45 mt-2 text-xs font-semibold">
                  {formatNotificationDate(item.created_at)}
                </p>
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/40 px-4 py-8 text-center">
            <p className="font-black">لا توجد إشعارات بعد</p>
            <p className="text-foreground/60 mt-2 text-sm leading-6">
              أي تحديثات مهمة في الحساب أو الكورسات هتظهر هنا.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
