"use client";

export function PurchaseScrollButton() {
  function handleClick() {
    const purchasePanel = document.getElementById("purchase");

    if (!purchasePanel) {
      return;
    }

    purchasePanel.scrollIntoView({ behavior: "smooth", block: "center" });
    window.history.replaceState(null, "", "#purchase");

    window.setTimeout(() => {
      const focusTarget = purchasePanel.querySelector<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), a[href]",
      );
      focusTarget?.focus({ preventScroll: true });
    }, 450);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn-primary mt-5 inline-flex px-5 py-2.5 text-sm"
    >
      الاشتراك في الكورس
    </button>
  );
}
