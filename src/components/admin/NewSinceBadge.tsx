import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface NewSinceBadgeProps {
  count: number;
  label?: string;
  className?: string;
}

/**
 * A small accent badge that highlights how many newly synced records
 * have arrived since the admin's last visit to a page.
 */
export function NewSinceBadge({ count, label = "new since last visit", className }: NewSinceBadgeProps) {
  if (!count || count <= 0) return null;
  return (
    <Badge
      variant="default"
      className={`gap-1 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 ${className ?? ""}`}
    >
      <Sparkles className="h-3 w-3" />
      {count} {label}
    </Badge>
  );
}
