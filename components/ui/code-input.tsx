"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type CodeInputProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function CodeInput({
  name,
  value,
  onChange,
  length = 6,
  label = "كود التفعيل",
  disabled = false,
  className,
}: CodeInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");
  const caretIndex = value.length;

  return (
    <div className={cn("relative", className)} dir="ltr">
      <input
        name={name}
        value={value}
        onChange={(event) =>
          onChange(
            event.currentTarget.value.replace(/\D/g, "").slice(0, length),
          )
        }
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        disabled={disabled}
        aria-label={label}
        className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
      />
      <div
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
      >
        {digits.map((digit, index) => {
          const isCaret = isFocused && index === caretIndex;

          return (
            <div
              key={index}
              className={cn(
                "flex h-12 items-center justify-center rounded-xl border-[1.5px] text-lg font-black tabular-nums transition-all",
                digit
                  ? "border-primary-300 bg-primary-50/70 text-primary-700"
                  : "bg-surface/70 text-foreground/25 border-border",
                isCaret &&
                  "border-primary-400 ring-primary-200/50 -translate-y-0.5 ring-4",
              )}
            >
              {digit ? (
                digit
              ) : isCaret ? (
                <span className="bg-primary-500 h-5 w-0.5 animate-pulse rounded-full" />
              ) : (
                <span className="bg-foreground/15 size-1.5 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
