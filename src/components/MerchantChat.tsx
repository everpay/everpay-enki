import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merchant-chat`;

async function streamChat({ messages, onDelta, onDone, onError }: {
  messages: Msg[]; onDelta: (text: string) => void; onDone: () => void; onError: (status: number, msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ messages }),
  });
  if (!resp.ok) { const body = await resp.json().catch(() => ({ error: "Request failed" })); onError(resp.status, body.error || "Request failed"); return; }
  if (!resp.body) { onDone(); return; }
  const reader = resp.body.getReader(); const decoder = new TextDecoder(); let buf = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, i); buf = buf.slice(i + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") break;
      try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); } catch {}
    }
  }
  onDone();
}

export function MerchantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    const text = input.trim(); if (!text || isLoading) return;
    setInput(""); const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]); setIsLoading(true);
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };
    try {
      await streamChat({ messages: [...messages, userMsg], onDelta: upsert, onDone: () => setIsLoading(false),
        onError: (status, msg) => { setIsLoading(false); toast({ title: status === 429 ? "Rate Limited" : "Error", description: msg, variant: "destructive" }); },
      });
    } catch { setIsLoading(false); toast({ title: "Connection error", variant: "destructive" }); }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="icon" className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90" aria-label="Open Everpay Assistant">
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] h-[520px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><span className="font-heading text-sm font-semibold text-foreground">Everpay Assistant</span></div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bot className="h-10 w-10 mx-auto mb-3 text-primary/40" />
            <p className="font-medium">How can I help?</p>
            <p className="text-xs mt-1">Ask about payments, transactions, settings, or any Everpay feature.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5"><Bot className="h-3.5 w-3.5 text-primary" /></div>}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {msg.content}
            </div>
            {msg.role === "user" && <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mt-0.5"><User className="h-3.5 w-3.5 text-primary-foreground" /></div>}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2"><div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-3.5 w-3.5 text-primary animate-pulse" /></div><div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">Thinking…</div></div>
        )}
      </div>
      <div className="border-t border-border px-3 py-3">
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about payments, invoices…" className="flex-1 text-sm" disabled={isLoading} />
          <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading || !input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
}
