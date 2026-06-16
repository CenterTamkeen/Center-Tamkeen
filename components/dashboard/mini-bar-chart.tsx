import { formatPrice } from "@/lib/format";

export function MiniBarChart({
  data,
  valueType = "number",
}: {
  data: { label: string; total: number }[];
  valueType?: "number" | "money";
}) {
  const max = Math.max(...data.map((item) => item.total), 1);

  if (data.length === 0) {
    return (
      <p className="text-foreground/60 rounded-xl bg-white/60 px-4 py-8 text-center">
        لا توجد بيانات كافية للعرض.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div
          key={item.label}
          className="grid gap-2 sm:grid-cols-[120px_1fr_120px] sm:items-center"
        >
          <span className="text-sm font-bold">{item.label}</span>
          <div className="bg-primary-50 h-3 overflow-hidden rounded-full">
            <div
              className="bg-primary-500 h-full rounded-full"
              style={{ width: `${Math.max(8, (item.total / max) * 100)}%` }}
            />
          </div>
          <span className="text-foreground/65 text-sm font-black sm:text-left">
            {valueType === "money"
              ? formatPrice(item.total)
              : item.total.toLocaleString("ar-EG")}
          </span>
        </div>
      ))}
    </div>
  );
}
