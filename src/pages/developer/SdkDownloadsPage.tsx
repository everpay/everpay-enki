import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink } from "lucide-react";
import { CodeBlock } from "@/components/developer/CodeBlock";

const sdks = [
  { name: "Node.js", pkg: "@everpay/node", version: "2.4.0", install: "npm install @everpay/node", color: "bg-accent/10 text-accent" },
  { name: "Python", pkg: "everpay", version: "1.8.0", install: "pip install everpay", color: "bg-primary/10 text-primary" },
  { name: "PHP", pkg: "everpay/everpay-php", version: "3.1.0", install: "composer require everpay/everpay-php", color: "bg-[hsl(250,60%,60%)]/10 text-[hsl(250,60%,60%)]" },
  { name: "Ruby", pkg: "everpay", version: "1.2.0", install: "gem install everpay", color: "bg-destructive/10 text-destructive" },
  { name: "Go", pkg: "github.com/everpay/everpay-go", version: "0.9.0", install: "go get github.com/everpay/everpay-go", color: "bg-accent/10 text-accent" },
  { name: "Java", pkg: "com.everpay:everpay-java", version: "2.0.1", install: "implementation 'com.everpay:everpay-java:2.0.1'", color: "bg-[hsl(30,80%,50%)]/10 text-[hsl(30,80%,50%)]" },
];

const SdkDownloadsPage = () => (
  <div className="max-w-4xl mx-auto space-y-8">
    <div>
      <Badge variant="secondary" className="mb-3">SDKs & Libraries</Badge>
      <h1 className="text-3xl font-bold tracking-tight">SDK Downloads</h1>
      <p className="text-muted-foreground mt-2">Official client libraries for every major language.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sdks.map((sdk) => (
        <Card key={sdk.name} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge className={sdk.color} variant="secondary">{sdk.name}</Badge>
              <span className="text-xs text-muted-foreground">v{sdk.version}</span>
            </div>
            <CardTitle className="text-sm font-mono mt-2">{sdk.pkg}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="code-block px-3 py-2 text-xs">{sdk.install}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs"><ExternalLink className="w-3 h-3" /> Docs</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs"><Download className="w-3 h-3" /> GitHub</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Checkout.js (Browser)</CardTitle>
        <CardDescription>Drop-in payment form for web applications.</CardDescription>
      </CardHeader>
      <CardContent>
        <CodeBlock code={`<!-- Add to your HTML -->\n<script src="https://js.everpayinc.com/v2/checkout.js"></script>\n\n<script>\n  const checkout = Everpay.checkout({\n    publishableKey: 'pk_test_your_key',\n    amount: 5000,\n    currency: 'usd',\n    onSuccess: (result) => console.log('Payment:', result.payment_id),\n  });\n  checkout.mount('#payment-form');\n</script>`} language="curl" />
      </CardContent>
    </Card>
  </div>
);

export default SdkDownloadsPage;