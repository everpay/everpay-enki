import { cn } from "@/lib/utils";

/**
 * Standardized inline error banner used across the project (Auth, Admin, etc.).
 * Matches the styling first introduced on the Auth page so error messages look
 * consistent everywhere.
 */
export function FormError({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      {title && <div className="font-medium mb-0.5">{title}</div>}
      <div className="text-destructive/90">{children}</div>
    </div>
  );
}