import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  data: unknown;
}

export function JsonDrawer({ open, onOpenChange, title, description, data }: JsonDrawerProps) {
  const { toast } = useToast();
  const text = data ? JSON.stringify(data, null, 2) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title || "Record details"}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={copy} className="gap-2">
            <Copy className="h-3.5 w-3.5" /> Copy JSON
          </Button>
        </div>
        <pre className="mt-3 max-h-[75vh] overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-[11px] leading-snug whitespace-pre-wrap break-words">
{text || "(no data)"}
        </pre>
      </SheetContent>
    </Sheet>
  );
}