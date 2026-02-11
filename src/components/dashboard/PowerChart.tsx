import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { SensorReading } from "@/hooks/useRealtimeReadings";

interface PowerChartProps {
  data: SensorReading[];
  title?: string;
}

export function PowerChart({ data, title = "Power Usage (W)" }: PowerChartProps) {
  const chartData = data.map((r) => ({
    time: new Date(r.recorded_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    power: r.power,
    voltage: r.voltage,
    current: r.current,
  }));

  return (
    <div className="chart-container">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }}
            stroke="hsl(220 16% 18%)"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }}
            stroke="hsl(220 16% 18%)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220 18% 10%)",
              border: "1px solid hsl(220 16% 18%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="power"
            stroke="hsl(142 71% 45%)"
            fill="url(#powerGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
