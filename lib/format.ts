export function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "مدة غير محددة";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes.toLocaleString("ar-EG")} دقيقة`;
}
