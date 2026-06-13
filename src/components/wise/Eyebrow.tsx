import { cn } from "@/lib/utils";

/**
 * Wise-style section eyebrow label. Goes above a heading.
 * Token-preserving — uses muted-foreground only.
 */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-xs md:text-sm uppercase tracking-[0.18em] text-muted-foreground font-medium",
        className,
      )}
    >
      {children}
    </p>
  );
}