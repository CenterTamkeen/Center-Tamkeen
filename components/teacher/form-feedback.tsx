"use client";

import type { ActionState } from "@/lib/auth/action-state";

export function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-danger text-sm">{message}</p>;
}

export function FormFeedback({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <div
      className={`animate-slide-down rounded-xl px-4 py-3 text-sm font-semibold ${
        state.status === "success" ? "text-primary-700" : "text-red-700"
      }`}
      style={{
        background:
          state.status === "success"
            ? "linear-gradient(135deg, rgb(231 245 241 / 0.8), rgb(197 232 223 / 0.5))"
            : "linear-gradient(135deg, rgb(254 226 226 / 0.8), rgb(254 202 202 / 0.5))",
      }}
    >
      {state.message}
    </div>
  );
}
