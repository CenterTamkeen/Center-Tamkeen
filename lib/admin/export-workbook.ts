import { Workbook } from "exceljs";

import type { ExportSheet } from "@/lib/admin/export-datasets";

const HEADER_FILL = "FF11705F";
const ZEBRA_FILL = "FFF1FAF7";
const BORDER_COLOR = "FFD8ECE6";

/** Excel rejects these characters in tab names and caps them at 31 chars. */
function toSafeSheetName(name: string) {
  return name.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);
}

function addSummarySheet(workbook: Workbook, sheets: ExportSheet[]) {
  const worksheet = workbook.addWorksheet("ملخص التصدير", {
    views: [{ rightToLeft: true }],
  });

  worksheet.columns = [
    { header: "الشيت", width: 28 },
    { header: "عدد الصفوف", width: 14 },
    { header: "عدد الأعمدة", width: 14 },
  ];

  for (const sheet of sheets) {
    worksheet.addRow([sheet.name, sheet.rows.length, sheet.columns.length]);
  }

  worksheet.addRow([]);
  worksheet.addRow([
    "إجمالي الصفوف",
    sheets.reduce((total, sheet) => total + sheet.rows.length, 0),
  ]);

  return worksheet;
}

function styleHeaderRow(worksheet: ReturnType<Workbook["addWorksheet"]>) {
  const header = worksheet.getRow(1);

  header.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 26;
}

export async function buildExportWorkbook(sheets: ExportSheet[]) {
  const workbook = new Workbook();

  workbook.creator = "سنتر تمكين";
  workbook.created = new Date();

  styleHeaderRow(addSummarySheet(workbook, sheets));

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(toSafeSheetName(sheet.name), {
      views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      width: column.width,
    }));

    styleHeaderRow(worksheet);

    for (const row of sheet.rows) {
      const addedRow = worksheet.addRow(row);

      addedRow.alignment = { vertical: "top", wrapText: false };

      if (addedRow.number % 2 === 1) {
        addedRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: ZEBRA_FILL },
        };
      }

      addedRow.border = {
        bottom: { style: "hair", color: { argb: BORDER_COLOR } },
      };
    }

    if (sheet.rows.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheet.columns.length },
      };
    }
  }

  return workbook.xlsx.writeBuffer();
}
