"use client";

import { useMemo, useState } from "react";
import {
  useWatch,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

export function PasswordInput<T extends FieldValues>({
  name,
  register,
  autoComplete,
  className,
}: {
  name: Path<T>;
  register: UseFormRegister<T>;
  autoComplete: string;
  className: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...register(name)}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className={`${className} pe-24`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="text-primary-700 hover:text-primary-500 absolute inset-y-1 left-1 rounded-lg px-3 text-xs font-black transition"
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {visible ? "إخفاء" : "إظهار"}
      </button>
    </div>
  );
}

export function PasswordStrength<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  const password = useWatch({ control, name }) as string | undefined;
  const result = useMemo(() => {
    const value = password ?? "";
    let score = 0;

    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (!value) return { score: 0, label: "اكتب كلمة مرور قوية" };
    if (score <= 1) return { score: 1, label: "ضعيفة" };
    if (score <= 3) return { score, label: "متوسطة" };
    return { score: 4, label: "قوية" };
  }, [password]);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${
              index < result.score ? "bg-primary-500" : "bg-primary-100"
            }`}
          />
        ))}
      </div>
      <p className="text-foreground/55 text-xs font-semibold">
        قوة كلمة المرور: {result.label}
      </p>
    </div>
  );
}
