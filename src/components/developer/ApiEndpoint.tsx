import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/utils";

interface Param {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

interface Props {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description: string;
  params?: Param[];
  code: Record<"curl" | "node" | "python", string>;
  response: string;
}

const methodColors: Record<string, string> = {
  GET: "bg-accent/15 text-accent border-accent/30",
  POST: "bg-primary/15 text-primary border-primary/30",
  PUT: "bg-[hsl(40,90%,50%)]/15 text-[hsl(40,90%,40%)] border-[hsl(40,90%,50%)]/30",
  PATCH: "bg-[hsl(40,90%,50%)]/15 text-[hsl(40,90%,40%)] border-[hsl(40,90%,50%)]/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
};

export const ApiEndpoint = ({ method, path, title, description, params, code, response }: Props) => {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("font-mono text-xs px-2 py-0.5", methodColors[method])}>
            {method}
          </Badge>
          <code className="text-sm font-mono text-muted-foreground">{path}</code>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {params && params.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Parameters</h4>
            <div className="border rounded-lg overflow-hidden">
              {params.map((p, i) => (
                <div key={p.name} className={cn("flex items-start gap-4 px-4 py-3 text-sm", i > 0 && "border-t")}>
                  <div className="min-w-[140px]">
                    <code className="text-xs font-mono font-semibold">{p.name}</code>
                    {p.required && <span className="text-destructive text-xs ml-1">*</span>}
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{p.type}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold mb-3">Request</h4>
          <CodeBlock code={code} />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Response</h4>
          <CodeBlock code={response} language="curl" />
        </div>
      </CardContent>
    </Card>
  );
};