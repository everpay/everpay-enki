import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { Shield, AlertTriangle } from "lucide-react";

const AuthenticationApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
        <p className="text-muted-foreground mt-2">Authenticate API requests using bearer tokens or API keys.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Bearer Token Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Include your API key in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization</code> header or <code className="text-xs bg-muted px-1.5 py-0.5 rounded">X-Everpay-Api-Key</code> header of every request.</p>
          <CodeBlock
            code={{
              curl: `curl https://api.everpayinc.com/v1/payments \\\n  -H "Authorization: Bearer sk_test_your_api_key"\n\n# Or use the API key header:\ncurl https://api.everpayinc.com/v1/payments \\\n  -H "X-Everpay-Api-Key: sk_test_your_api_key"`,
              node: `const Everpay = require('@everpay/node');\nconst everpay = new Everpay('sk_test_your_api_key');\n\n// All subsequent calls are authenticated\nconst payments = await everpay.payments.list();`,
              python: `import everpay\neverpay.api_key = "sk_test_your_api_key"\n\n# All subsequent calls are authenticated\npayments = everpay.Payment.list()`,
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-lg">Key Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Secret keys</strong> (<code className="text-xs bg-muted px-1 rounded">sk_</code>) must only be used server-side. Never expose them in client-side code.</p>
          <p><strong>Publishable keys</strong> (<code className="text-xs bg-muted px-1 rounded">pk_</code>) can be used in browser or mobile apps for checkout widgets.</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="font-semibold text-foreground text-xs mb-1">Sandbox Keys</p>
              <p className="text-xs">Prefix: <code>sk_test_</code> / <code>pk_test_</code></p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="font-semibold text-foreground text-xs mb-1">Production Keys</p>
              <p className="text-xs">Prefix: <code>sk_live_</code> / <code>pk_live_</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Error Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock
            code={`// 401 Unauthorized\n{\n  "error": {\n    "type": "authentication_error",\n    "message": "Invalid API key provided.",\n    "code": "invalid_api_key"\n  }\n}\n\n// 403 Forbidden\n{\n  "error": {\n    "type": "authorization_error",\n    "message": "This key does not have permission for this resource.",\n    "code": "insufficient_permissions"\n  }\n}`}
            language="curl"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthenticationApiPage;