import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCw } from "lucide-react";

export type RoutingFilters = {
  period: "24h" | "7d" | "30d" | "90d";
  processors: string[];
  merchantIds: string[];
};

export const DEFAULT_FILTERS: RoutingFilters = { period: "30d", processors: [], merchantIds: [] };

const PERIODS: { id: RoutingFilters["period"]; label: string }[] = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
];

export function periodToRange(p: RoutingFilters["period"]): { from: string; to: string } {
  const to = new Date();
  const days = p === "24h" ? 1 : p === "7d" ? 7 : p === "30d" ? 30 : 90;
  return { from: new Date(to.getTime() - days * 86_400_000).toISOString(), to: to.toISOString() };
}

type Option = { id: string; label: string };

export function RoutingFiltersBar({
  filters,
  onChange,
  onRefresh,
  processorOptions,
  merchantOptions,
  loading,
}: {
  filters: RoutingFilters;
  onChange: (f: RoutingFilters) => void;
  onRefresh?: () => void;
  processorOptions: Option[];
  merchantOptions: Option[];
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border bg-card p-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange({ ...filters, period: p.id })}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filters.period === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <MultiSelect
        label="Processors"
        options={processorOptions}
        selected={filters.processors}
        onChange={(v) => onChange({ ...filters, processors: v })}
      />
      <MultiSelect
        label="Merchants"
        options={merchantOptions}
        selected={filters.merchantIds}
        onChange={(v) => onChange({ ...filters, merchantIds: v })}
      />

      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      )}
    </div>
  );
}

function MultiSelect({
  label, options, selected, onChange,
}: { label: string; options: Option[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          {label}
          {selected.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{selected.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}…`}
          className="w-full mb-2 px-2 py-1.5 text-sm rounded-md border bg-background"
        />
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {filtered.length === 0 && <p className="text-xs text-muted-foreground px-2 py-3 text-center">No matches</p>}
          {filtered.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <label key={o.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    onChange(v ? [...selected, o.id] : selected.filter((s) => s !== o.id));
                  }}
                />
                <span className="text-sm">{o.label}</span>
              </label>
            );
          })}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}