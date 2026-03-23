import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

const guides = [
  { title: "Accept Your First Payment", desc: "End-to-end guide to processing a card payment.", time: "10 min", tags: ["Payments", "Cards"], difficulty: "Beginner" },
  { title: "Set Up Webhooks", desc: "Listen to real-time events and automate your workflow.", time: "8 min", tags: ["Webhooks", "Events"], difficulty: "Beginner" },
  { title: "Multi-Processor Routing", desc: "Configure smart routing across ShieldHub, Mondo, and regional processors.", time: "15 min", tags: ["Routing", "Processors"], difficulty: "Advanced" },
  { title: "Subscription Billing", desc: "Create recurring billing plans with dunning and retry logic.", time: "12 min", tags: ["Subscriptions"], difficulty: "Intermediate" },
  { title: "Marketplace Split Payments", desc: "Split payments between platform and connected merchants.", time: "20 min", tags: ["Marketplace"], difficulty: "Advanced" },
  { title: "3D Secure Integration", desc: "Add 3DS authentication to reduce fraud.", time: "10 min", tags: ["3DS", "Security"], difficulty: "Intermediate" },
  { title: "Shopify Integration", desc: "Connect your Shopify store with Everpay checkout.", time: "15 min", tags: ["Shopify", "E-commerce"], difficulty: "Intermediate" },
  { title: "Open Banking Payments", desc: "Accept A2A payments via Mondo and Prometeo.", time: "12 min", tags: ["Open Banking"], difficulty: "Advanced" },
];

const diffColors: Record<string, string> = { Beginner: "bg-accent/15 text-accent", Intermediate: "bg-primary/15 text-primary", Advanced: "bg-destructive/15 text-destructive" };

const GuidesPage = () => (
  <div className="max-w-4xl mx-auto space-y-8">
    <div>
      <Badge variant="secondary" className="mb-3">Guides</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Integration Guides</h1>
      <p className="text-muted-foreground mt-2">Step-by-step tutorials for common integration patterns.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {guides.map((g) => (
        <Card key={g.title} className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={`text-[10px] ${diffColors[g.difficulty]}`}>{g.difficulty}</Badge>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> {g.time}</span>
            </div>
            <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
              {g.title}
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">{g.desc}</CardDescription>
            <div className="flex gap-1.5 mt-3">{g.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default GuidesPage;