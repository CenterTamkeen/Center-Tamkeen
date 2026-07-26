import type { Metadata } from "next";

import { AdminExportPanel } from "@/components/admin/admin-export-panel";
import { getExportDatasetCounts } from "@/lib/admin/export-data";
import { exportDatasets } from "@/lib/admin/export-datasets";

export const metadata: Metadata = {
  title: "تصدير البيانات",
};

export default async function AdminExportsPage() {
  const counts = await getExportDatasetCounts();
  const totalRows = exportDatasets.reduce(
    (total, dataset) => total + Math.max(counts[dataset.key] ?? 0, 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">تصدير البيانات</p>
          <h2 className="text-xl font-black">نزّل بيانات المنصة على Excel</h2>
        </div>
        <div className="chip">
          {totalRows.toLocaleString("ar-EG")} صف متاح للتصدير
        </div>
      </div>

      <AdminExportPanel counts={counts} />
    </div>
  );
}
