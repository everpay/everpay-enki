import { cn } from "@/lib/utils";

/**
 * Wise-style display heading. Use on hero/landing/auth/marketing.
 * Token-preserving — colors come from `text-foreground`.
 */
export function DisplayHeading({
  children,
  className,
  as: As = "h1",
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: "md" | "lg" | "xl";
}) {
  const sizes = {
    md: "text-4xl md:text-5xl",
    lg: "text-5xl md:text-7xl",
    xl: "text-6xl md:text-8xl",
  } as const;
  return (
    <As
      className={cn(
        "font-heading font-bold tracking-tight leading-[0.95] text-foreground",
        sizes[size],
        className,
      )}
    >
      {children}
    </As>
  );
}