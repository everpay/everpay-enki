import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { exportAsCSV, exportAsPDF } from '@/lib/export-utils';

export function ExportButton({ data, filename, disabled }: { data: Record<string, unknown>[]; filename: string; disabled?: boolean }) {
  const isEmpty = !data || data.length === 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isEmpty} className="gap-2">
          <Download className="h-4 w-4" />Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={() => exportAsCSV(data, filename)} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" /> CSV ({data.length})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPDF(data, filename)} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" /> PDF ({data.length})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}