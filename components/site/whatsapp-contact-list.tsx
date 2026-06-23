import { buildWhatsappHref, supportContacts } from "@/lib/support-contacts";

type WhatsappContactListProps = {
  message?: string;
  compact?: boolean;
};

export function WhatsappContactList({
  message,
  compact = false,
}: WhatsappContactListProps) {
  return (
    <div
      className={`rounded-xl border ${
        compact ? "bg-white/55 p-3" : "bg-white/65 p-4"
      }`}
      style={{ borderColor: "rgb(208 227 218 / 0.7)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-primary-700 text-sm font-black">
          محتاج كود التفعيل؟
        </p>
        <span className="text-foreground/50 text-xs font-bold">واتساب فقط</span>
      </div>
      <p className="text-foreground/60 mt-1 text-sm leading-6">
        تواصل مع أي رقم من الأرقام دي عشان تستلم الكود.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {supportContacts.map((contact) => (
          <a
            key={contact.whatsappNumber}
            href={buildWhatsappHref(contact, message)}
            target="_blank"
            rel="noreferrer"
            className="border-primary-100 bg-primary-50/45 text-primary-800 hover:bg-primary-50 flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-black transition-colors"
          >
            <span className="truncate">{contact.phone}</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
