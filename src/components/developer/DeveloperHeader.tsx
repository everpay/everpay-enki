import { Menu, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface Props {
  onMenuToggle: () => void;
}

export const DeveloperHeader = ({ onMenuToggle }: Props) => {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/90 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-full hover:bg-muted">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search API docs..."
            className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-1 rounded-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 rounded-full" asChild>
          <Link to="/dashboard">
            <ExternalLink className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </Button>
        <div className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          v2
        </div>
      </div>
    </header>
  );
};
