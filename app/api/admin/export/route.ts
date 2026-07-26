import { NextResponse } from "next/server";

import { buildExportSheets } from "@/lib/admin/export-data";
import {
  exportDatasetKeys,
  isExportDatasetKey,
} from "@/lib/admin/export-datasets";
import { buildExportWorkbook } from "@/lib/admin/export-workbook";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function parseDatasets(value: string | null) {
  if (!value) {
    return [...exportDatasetKeys];
  }

  const requested = value
    .split(",")
    .map((key) => key.trim())
    .filter(isExportDatasetKey);

  return [...new Set(requested)];
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "لازم تسجل دخول الأول." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "الصفحة دي للأدمن بس." },
      { status: 403 },
    );
  }

  const datasets = parseDatasets(
    new URL(request.url).searchParams.get("datasets"),
  );

  if (datasets.length === 0) {
    return NextResponse.json(
      { error: "اختار على الأقل جدول واحد للتصدير." },
      { status: 400 },
    );
  }

  try {
    const sheets = await buildExportSheets(datasets);
    const workbook = await buildExportWorkbook(sheets);
    const filename = `tamkeen-data-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(workbook as ArrayBuffer, {
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin:export]", error);

    return NextResponse.json(
      { error: "حصلت مشكلة وإحنا بنجهز الملف. جرب تاني." },
      { status: 500 },
    );
  }
}
