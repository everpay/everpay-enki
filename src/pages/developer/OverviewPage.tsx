import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, CreditCard, Key, Webhook, BookOpen, Code2, ArrowRight } from "lucide-react";

const quickLinks = [
  { title: "Quick Start", desc: "Get up and running in 5 minutes", icon: Zap, to: "/developers/quickstart", color: "text-accent" },
  { title: "Payments API", desc: "Accept payments globally", icon: CreditCard, to: "/developers/api/payments", color: "text-primary" },
  { title: "API Keys", desc: "Manage sandbox & production keys", icon: Key, to: "/developers/keys", color: "text-primary" },
  { title: "Webhooks", desc: "Listen to real-time events", icon: Webhook, to: "/developers/webhooks", color: "text-accent" },
  { title: "Guides", desc: "Step-by-step integration tutorials", icon: BookOpen, to: "/developers/guides", color: "text-primary" },
  { title: "Code Examples", desc: "Copy-paste ready snippets", icon: Code2, to: "/developers/examples", color: "text-accent" },
];

const OverviewPage = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="gradient-text">everpay</span> Developer Platform
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Build powerful payment experiences with our unified API. Accept cards, wallets, bank transfers, and crypto — all through one integration.
        </p>
        <div className="flex gap-3 pt-2">
          <Button asChild>
            <Link to="/developers/quickstart">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/developers/api/payments">API Reference</Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="code-block p-5">
          <pre className="text-sm">
            <span className="comment">// Create a payment in seconds</span>{"\n"}
            <span className="keyword">const</span> payment = <span className="keyword">await</span> everpay.payments.<span className="function">create</span>({"{"}{"\n"}
            {"  "}amount: <span className="string">5000</span>,{"\n"}
            {"  "}currency: <span className="string">'usd'</span>,{"\n"}
            {"  "}method: <span className="string">'card'</span>,{"\n"}
            {"  "}description: <span className="string">'Order #1234'</span>{"\n"}
            {"}"});
          </pre>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <link.icon className={`w-5 h-5 ${link.color} mb-1`} />
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {link.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{link.desc}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="code-block px-4 py-3 text-sm">
            https://api.everpayinc.com/v1
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            All API requests must include your API key in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization</code> header.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPage;