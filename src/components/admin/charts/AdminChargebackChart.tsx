import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAdminTransactionAnalytics } from "@/hooks/useAdminTransactionAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

export default function AdminChargebackChart() {
  const isMobile = useIsMobile();
  const { data } = useAdminTransactionAnalytics();
  const chartData = data?.monthlyData?.map(m => ({ name: m.month, chargebacks: m.chargebacks, refunds: m.refunds })) || [];

  return (
    <div className="h-[200px] md:h-[250px] w-full">
      <ChartContainer config={{ chargebacks: { label: "Chargebacks", color: "hsl(var(--destructive))" }, refunds: { label: "Refunds", color: "hsl(var(--chart-2))" } }}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 50} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
          <ChartTooltip content={<ChartTooltipContent labelKey="name" />} />
          {!isMobile && <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />}
          <Line type="monotone" dataKey="chargebacks" name="Chargebacks" stroke="hsl(var(--destructive))" strokeWidth={2} />
          <Line type="monotone" dataKey="refunds" name="Refunds" stroke="hsl(var(--chart-2))" strokeWidth={2} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
