"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildCsv, downloadCsv } from "@/lib/export-csv";

export function ExportCsvButton({
  filename,
  headers,
  rows,
  label = "Export CSV",
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1.5"
      disabled={disabled || rows.length === 0}
      onClick={() => downloadCsv(filename, buildCsv(headers, rows))}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
