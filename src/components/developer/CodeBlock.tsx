import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "curl" | "node" | "python";

const langLabels: Record<Lang, string> = {
  curl: "cURL",
  node: "Node.js",
  python: "Python",
};

interface Props {
  code: Record<Lang, string> | string;
  language?: Lang;
  className?: string;
}

export const CodeBlock = ({ code, language, className }: Props) => {
  const isMulti = typeof code === "object";
  const [activeLang, setActiveLang] = useState<Lang>(language || (isMulti ? "curl" : "curl"));
  const [copied, setCopied] = useState(false);

  const currentCode = isMulti ? (code as Record<Lang, string>)[activeLang] : (code as string);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      {isMulti && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex gap-1">
            {(Object.keys(code) as Lang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  activeLang === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {langLabels[lang]}
              </button>
            ))}
          </div>
          <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      <div className="code-block p-4 relative group">
        {!isMulti && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted/20 transition-all opacity-0 group-hover:opacity-100 text-muted-foreground"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
        <pre className="text-sm whitespace-pre-wrap">{currentCode}</pre>
      </div>
    </div>
  );
};