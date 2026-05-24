import { Switch } from "@/components/ui/switch";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { cn } from "@/lib/utils";

export function EnvironmentToggle({ className, showLabels = true }: { className?: string; showLabels?: boolean }) {
  const { isTestMode, setEnvironment } = useEnvironment();
  const isLive = !isTestMode;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLabels && (
        <span className={cn("flex items-center gap-1.5 text-xs font-semibold", isTestMode ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", isTestMode ? "bg-amber-500" : "bg-muted-foreground/40")} />Test
        </span>
      )}
      <Switch checked={isLive} onCheckedChange={(c) => setEnvironment(c ? "live" : "test")}
        aria-label="Toggle between Test and Live environment"
        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-amber-500" />
      {showLabels && (
        <span className={cn("flex items-center gap-1.5 text-xs font-semibold", isLive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-emerald-500" : "bg-muted-foreground/40")} />Live
        </span>
      )}
    </div>
  );
}