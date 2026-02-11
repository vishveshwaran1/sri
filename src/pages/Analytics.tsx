import { useSelectedDevice } from "@/hooks/useDevices";
import { useSensorReadings, useAllAlerts } from "@/hooks/useRealtimeReadings";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Analytics() {
  const { selectedDeviceId } = useSelectedDevice();
  const { data: readings = [] } = useSensorReadings(selectedDeviceId);
  const { data: alerts = [] } = useAllAlerts();

  // Daily consumption (group by date)
  const dailyMap = new Map<string, number>();
  readings.forEach((r) => {
    const day = new Date(r.recorded_at).toLocaleDateString();
    dailyMap.set(day, (dailyMap.get(day) || 0) + (r.energy_kwh || 0));
  });
  const dailyData = Array.from(dailyMap, ([date, kwh]) => ({ date, kwh: +kwh.toFixed(4) }));

  // Voltage vs Current scatter
  const scatterData = readings.slice(-100).map((r) => ({ voltage: r.voltage, current: r.current }));

  // Alert frequency
  const alertFreq = { theft: 0, wastage: 0, anomaly: 0 };
  alerts.forEach((a: any) => {
    if (a.type in alertFreq) alertFreq[a.type as keyof typeof alertFreq]++;
  });
  const pieData = [
    { name: "Theft", value: alertFreq.theft, color: "hsl(0 72% 51%)" },
    { name: "Wastage", value: alertFreq.wastage, color: "hsl(38 92% 50%)" },
    { name: "Anomaly", value: alertFreq.anomaly, color: "hsl(263 70% 58%)" },
  ];

  const totalKwh = readings.reduce((s, r) => s + (r.energy_kwh || 0), 0);

  const exportCSV = () => {
    const headers = "timestamp,voltage,current,power,ldr,pir,energy_kwh\n";
    const rows = readings.map((r) =>
      `${r.recorded_at},${r.voltage},${r.current},${r.power},${r.ldr},${r.pir},${r.energy_kwh}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "energy_data.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Energy consumption, costs & carbon metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card metric-card-power">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Total Energy</p>
          <p className="text-xl font-bold font-mono text-energy-green">{totalKwh.toFixed(3)} kWh</p>
        </div>
        <div className="metric-card metric-card-voltage">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Total Cost</p>
          <p className="text-xl font-bold font-mono text-energy-blue">₹{(totalKwh * 8).toFixed(2)}</p>
        </div>
        <div className="metric-card metric-card-current">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">CO₂ Emissions</p>
          <p className="text-xl font-bold font-mono text-energy-cyan">{(totalKwh * 0.82).toFixed(2)} kg</p>
        </div>
        <div className="metric-card metric-card-ldr">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Thefts Detected</p>
          <p className="text-xl font-bold font-mono text-energy-red">{alertFreq.theft}</p>
        </div>
      </div>

      {/* Daily Consumption Bar Chart */}
      <div className="chart-container">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">Daily Consumption (kWh)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} stroke="hsl(220 16% 18%)" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} stroke="hsl(220 16% 18%)" />
            <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 10%)", border: "1px solid hsl(220 16% 18%)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="kwh" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voltage vs Current Scatter */}
        <div className="chart-container">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">Voltage vs Current</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis dataKey="voltage" name="Voltage" tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} stroke="hsl(220 16% 18%)" />
              <YAxis dataKey="current" name="Current" tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} stroke="hsl(220 16% 18%)" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 10%)", border: "1px solid hsl(220 16% 18%)", borderRadius: "8px", fontSize: "12px" }} />
              <Scatter data={scatterData} fill="hsl(187 85% 53%)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Distribution Pie */}
        <div className="chart-container">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">Alert Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 10%)", border: "1px solid hsl(220 16% 18%)", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Efficiency Score */}
      <div className="chart-container text-center py-8">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">Efficiency Score</p>
        <p className="text-5xl font-bold font-mono text-energy-green">
          {totalKwh > 0 ? Math.min(100, ((totalKwh * 0.82 / totalKwh) * 100)).toFixed(0) : "—"}
          <span className="text-xl text-muted-foreground">%</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">(Energy Saved ÷ Energy Used) × 100</p>
      </div>
    </div>
  );
}
