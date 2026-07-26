import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

function StrokeIcon({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
    >
      {children}
    </svg>
  );
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.115-.198.057-.371-.03-.52-.086-.148-.66-1.59-.904-2.178-.238-.571-.48-.49-.66-.499a11.6 11.6 0 0 0-.6-.01 1.15 1.15 0 0 0-.83.39c-.286.31-1.09 1.063-1.09 2.592 0 1.53 1.117 3.008 1.272 3.215.156.208 2.2 3.36 5.33 4.71.745.322 1.327.514 1.78.658.748.238 1.43.204 1.968.124.6-.09 1.85-.756 2.11-1.487.26-.73.26-1.356.183-1.487-.078-.13-.28-.21-.577-.36z" />
      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.947c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.9 11.9 0 0 0 5.71 1.447h.006c6.585 0 11.946-5.36 11.949-11.948a11.86 11.86 0 0 0-3.48-8.397M12.05 21.785h-.004a9.9 9.9 0 0 1-5.03-1.378l-.36-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 0 1-1.511-5.26c.002-5.45 4.436-9.884 9.889-9.884a9.82 9.82 0 0 1 6.988 2.898 9.83 9.83 0 0 1 2.894 6.994c-.003 5.45-4.437 9.885-9.889 9.885" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </StrokeIcon>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </StrokeIcon>
  );
}

export function PriceTagIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <path d="M7 7h.01" />
    </StrokeIcon>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <path d="M13 5v14" />
    </StrokeIcon>
  );
}

export function LockOpenIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </StrokeIcon>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </StrokeIcon>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </StrokeIcon>
  );
}

export function AlertCircleIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </StrokeIcon>
  );
}

export function PlayCircleIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4z" />
    </StrokeIcon>
  );
}

export function LogInIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <path d="m14 17 5-5-5-5" />
      <path d="M19 12H9" />
    </StrokeIcon>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={cn("animate-spin", className)}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </StrokeIcon>
  );
}
