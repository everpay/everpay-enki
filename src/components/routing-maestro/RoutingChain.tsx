import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Minus } from "lucide-react";

export interface RoutingStep {
  processor: string;
  status: 'success' | 'failed' | 'pending' | 'skipped';
  latency?: number;
  reason?: string;
}

interface RoutingChainProps {
  steps: RoutingStep[];
}

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  pending: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
  skipped: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
};

export function RoutingChain({ steps }: RoutingChainProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, i) => {
        const config = statusConfig[step.status];
        const Icon = config.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-2"
          >
            {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${config.bg} ${config.border}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-sm font-medium text-foreground">{step.processor}</span>
              {step.latency && <span className="text-xs font-mono text-muted-foreground">{step.latency}ms</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
