type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="glass-panel rounded-lg px-5 py-12 text-center">
      <h2 className="text-lg font-black">{title}</h2>
      <p className="text-foreground/65 mx-auto mt-2 max-w-md leading-7">
        {description}
      </p>
    </div>
  );
}
