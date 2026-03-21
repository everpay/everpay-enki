import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAdminTransactionAnalytics } from "@/hooks/useAdminTransactionAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

export default function AdminRevenueChart() {
  const isMobile = useIsMobile();
  const { data } = useAdminTransactionAnalytics();
  const chartData = data?.monthlyData?.map(m => ({ month: m.month, revenue: m.revenue, refunds: m.refunds })) || [];

  return (
    <div className="h-[200px] md:h-[250px] w-full">
      <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" }, refunds: { label: "Refunds", color: "hsl(var(--chart-2))" } }}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 50} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
          <ChartTooltip content={<ChartTooltipContent labelKey="month" />} />
          {!isMobile && <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />}
          <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="refunds" name="Refunds" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
