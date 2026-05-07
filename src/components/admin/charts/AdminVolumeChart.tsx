import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useAdminTransactionAnalytics } from "@/hooks/useAdminTransactionAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function AdminVolumeChart() {
  const isMobile = useIsMobile();
  const { data } = useAdminTransactionAnalytics();
  const chartData = data?.dailyData || [];

  return (
    <div className="h-[250px] md:h-[300px] w-full">
      <ChartContainer config={{
        volume: { label: "Approved ($)", color: "hsl(var(--primary))" },
        declinedAmount: { label: "Declined ($)", color: "hsl(var(--destructive))" },
      }}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAdminVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAdminDeclined" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 50} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
          <ChartTooltip content={<ChartTooltipContent labelKey="date" />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="volume" name="Approved" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAdminVolume)" />
          <Area type="monotone" dataKey="declinedAmount" name="Declined" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorAdminDeclined)" />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
