import type { Metadata } from "next";
import Link from "next/link";

import { OrderAcceptForm } from "@/components/admin/order-accept-form";
import { OrderRejectForm } from "@/components/admin/order-reject-form";
import { getAdminOrders } from "@/lib/admin/data";
import { formatPrice } from "@/lib/storefront/data";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels = {
  all: "كل الطلبات",
  pending: "قيد الانتظار",
  completed: "مكتمل",
  rejected: "مرفوض",
} as const;

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getStatus(value?: string): OrderStatus | "all" {
  if (value === "pending" || value === "completed" || value === "rejected") {
    return value;
  }

  return "all";
}

export const metadata: Metadata = {
  title: "متابعة الطلبات",
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const status = getStatus(getParam(params, "status"));
  const orders = await getAdminOrders(status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">الطلبات</p>
          <h2 className="text-xl font-black">متابعة طلبات الطلاب</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <Link
              key={key}
              href={`/dashboard/admin/orders${key === "all" ? "" : `?status=${key}`}`}
              className={
                status === key
                  ? "btn-primary px-3 py-2 text-xs"
                  : "btn-secondary px-3 py-2 text-xs"
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <article key={order.id} className="card-modern p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">
                      {order.student?.profile?.full_name ?? "طالب غير معروف"}
                    </h3>
                    <span className="chip">{statusLabels[order.status]}</span>
                  </div>
                  <p className="text-foreground/65 mt-2 text-sm leading-6">
                    رقم الطالب: {order.student?.student_phone ?? "غير متاح"} ·
                    فوري: {order.fawry_ref_no ?? "لم يصدر بعد"}
                  </p>
                  <div className="text-foreground/65 mt-3 space-y-1 text-sm">
                    {order.order_items.map((item) => (
                      <p key={item.id}>
                        {item.course?.title ?? "كورس محذوف"} ·{" "}
                        {item.course?.teacher?.profile?.full_name ??
                          "مدرس غير معروف"}{" "}
                        · {formatPrice(item.price_at_purchase)}
                      </p>
                    ))}
                  </div>
                  {order.rejection_reason ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      سبب الرفض: {order.rejection_reason}
                    </p>
                  ) : null}
                  {order.status !== "completed" ? (
                    <div className="mt-4 space-y-3">
                      <OrderAcceptForm orderId={order.id} />
                      {order.status !== "rejected" ? (
                        <OrderRejectForm orderId={order.id} />
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="text-left">
                  <p className="heading-gradient text-2xl font-black">
                    {formatPrice(order.total_amount)}
                  </p>
                  <p className="text-foreground/50 mt-2 text-xs font-semibold">
                    {new Date(order.created_at).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد طلبات بهذا الفلتر.
          </div>
        )}
      </div>
    </div>
  );
}
