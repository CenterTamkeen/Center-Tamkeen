type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="glass-panel-strong relative overflow-hidden rounded-xl px-6 py-16 text-center">
      {/* Decorative background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--primary-700) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Floating icon */}
      <div
        className="animate-bounce-subtle mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgb(231 245 241 / 0.8), rgb(197 232 223 / 0.5))",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary-500)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>
      </div>

      <h2 className="relative text-lg font-black">{title}</h2>
      <p className="text-foreground/60 relative mx-auto mt-2.5 max-w-md leading-7">
        {description}
      </p>
    </div>
  );
}
