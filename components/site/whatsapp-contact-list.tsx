import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { buildWhatsappHref, supportContacts } from "@/lib/support-contacts";

type WhatsappContactListProps = {
  message?: string;
  compact?: boolean;
};

function WhatsappBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl text-white",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, #25d366, #128c7e)",
        boxShadow: "0 8px 20px -8px rgb(18 140 126 / 0.7)",
      }}
    >
      <WhatsappIcon className="size-4.5" />
    </span>
  );
}

function ContactGrid({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {supportContacts.map((contact) => (
        <a
          key={contact.whatsappNumber}
          href={buildWhatsappHref(contact, message)}
          target="_blank"
          rel="noreferrer"
          className="group border-primary-100 bg-surface/85 hover:border-primary-300 hover:bg-primary-50/60 flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 transition-all hover:-translate-y-0.5"
        >
          <span className="bg-primary-100/60 text-primary-700 grid size-7 shrink-0 place-items-center rounded-lg">
            <WhatsappIcon className="size-3.5" />
          </span>
          <span
            dir="ltr"
            className="text-foreground min-w-0 flex-1 truncate text-start text-sm font-black tabular-nums"
          >
            {contact.phone}
          </span>
          <ArrowUpRightIcon className="text-primary-400 size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      ))}
    </div>
  );
}

export function WhatsappContactList({
  message,
  compact = false,
}: WhatsappContactListProps) {
  if (compact) {
    return (
      <details className="group border-primary-100 bg-primary-50/40 rounded-2xl border open:pb-3">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
          <WhatsappBadge />
          <span className="min-w-0 flex-1">
            <span className="text-primary-700 block text-sm font-black">
              محتاج كود التفعيل؟
            </span>
            <span className="text-foreground/60 block text-xs">
              اضغط لعرض أرقام الدعم على واتساب
            </span>
          </span>
          <ChevronDownIcon className="text-primary-500 size-4 transition-transform group-open:rotate-180" />
        </summary>
        <ContactGrid
          message={message}
          className="animate-slide-down px-3 sm:grid-cols-2"
        />
      </details>
    );
  }

  return (
    <div className="border-primary-100 bg-primary-50/40 rounded-2xl border p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <WhatsappBadge className="size-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-primary-700 text-sm font-black">
              محتاج كود التفعيل؟
            </p>
            <span className="border-primary-200/70 bg-primary-100/50 text-primary-700 rounded-full border px-2 py-0.5 text-[11px] font-black">
              واتساب فقط
            </span>
          </div>
          <p className="text-foreground/60 mt-1 text-xs leading-6 sm:text-sm">
            اختار أي رقم من أرقام الدعم وابعت رسالة، وهتستلم الكود منهم.
          </p>
        </div>
      </div>

      <ContactGrid
        message={message}
        className="mt-3.5 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
