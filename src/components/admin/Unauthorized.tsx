import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

interface UnauthorizedProps {
  message?: string;
  inLayout?: boolean;
}

function Body({ message }: { message?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <ShieldOff className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
        Access denied
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {message ?? "This area is restricted to platform administrators."}
      </p>
      <Button className="mt-6" variant="outline" onClick={() => navigate("/enki")}>
        Return to dashboard
      </Button>
    </div>
  );
}

export default function Unauthorized({ message, inLayout = true }: UnauthorizedProps) {
  if (!inLayout) return <Body message={message} />;
  return (
    <AppLayout>
      <Body message={message} />
    </AppLayout>
  );
}