import { AppLayout } from "@/components/AppLayout";
import { useRoutingAttemptLogs, useStrategyProcessors } from "@/hooks/useProcessorStrategy";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  declined: <XCircle className="h-4 w-4 text-destructive" />,
  error: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  timeout: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export default function AdminRoutingLogs() {
  const { data: routingLogs = [] } = useRoutingAttemptLogs();
  const { data: processors = [] } = useStrategyProcessors();

  const transactions = routingLogs.reduce<Record<string, any[]>>((acc, log: any) => {
    if (!acc[log.transaction_id]) acc[log.transaction_id] = [];
    acc[log.transaction_id].push(log);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Routing Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Transaction routing attempt history</p>
        </div>

        {Object.keys(transactions).length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <p className="text-muted-foreground text-sm">No routing logs yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(transactions).map(([txnId, logs], i) => {
              const sortedLogs = logs.sort((a: any, b: any) => a.attempt_order - b.attempt_order);
              const finalLog = sortedLogs[sortedLogs.length - 1];
              const success = finalLog.status === "success";
              return (
                <motion.div key={txnId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {success ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="font-mono text-sm font-medium text-foreground">{txnId}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{sortedLogs.length} attempt{sortedLogs.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {sortedLogs.map((log: any, j: number) => {
                      const proc = processors.find((p: any) => p.id === log.processor_id);
                      return (
                        <div key={log.id} className="flex items-center gap-1">
                          {j > 0 && <span className="text-muted-foreground mx-1">→</span>}
                          <div className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${
                            log.status === "success" ? "border-green-500/30 bg-green-500/5" :
                            log.status === "declined" ? "border-destructive/30 bg-destructive/5" :
                            "border-yellow-500/30 bg-yellow-500/5"
                          }`}>
                            {statusIcon[log.status] ?? statusIcon.error}
                            <span className="font-medium text-foreground">{proc?.name ?? log.processor_id}</span>
                            <span className="font-mono text-muted-foreground">{log.response_time}ms</span>
                            {log.response_code && <span className="font-mono text-muted-foreground">({log.response_code})</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
