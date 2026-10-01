// Spreadsheet export using SheetJS (Community Edition).
import * as XLSX from "xlsx";

export function exportRowsToXlsx(rows, filename = "export.xlsx") {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Friendlier column widths based on the longest cell in each column.
  ws["!cols"] = rows[0].map((_, c) => {
    let w = 8;
    for (let r = 0; r < rows.length; r++) {
      const v = rows[r]?.[c];
      if (v != null) w = Math.max(w, String(v).length + 2);
    }
    return { wch: Math.min(w, 60) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Atomics");
  XLSX.writeFile(wb, filename);
}