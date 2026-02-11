import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import { useSensorReadings } from "@/hooks/useRealtimeReadings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(263 70% 58%)"];

export default function DeviceCompare() {
  const { data: devices = [] } = useDevices();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addDevice = (id: string) => {
    if (id && !selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeDevice = (id: string) => {
    setSelectedIds(selectedIds.filter((s) => s !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Device Comparison</h1>
        <p className="text-sm text-muted-foreground">Side-by-side power charts for multiple devices</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select onValueChange={addDevice}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Add device..." />
          </SelectTrigger>
          <SelectContent>
            {devices
              .filter((d) => !selectedIds.includes(d.id))
              .map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>

        {selectedIds.map((id, i) => {
          const dev = devices.find((d) => d.id === id);
          return (
            <button
              key={id}
              onClick={() => removeDevice(id)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-border hover:bg-secondary"
              style={{ borderColor: COLORS[i] }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
              {dev?.name || "Unknown"}
              <span className="text-muted-foreground">×</span>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && <CompareChart deviceIds={selectedIds} devices={devices} />}
    </div>
  );
}

function CompareChart({ deviceIds, devices }: { deviceIds: string[]; devices: any[] }) {
  // Fetch readings for each device
  const readings: Record<string, any[]> = {};
  deviceIds.forEach((id) => {
    const { data } = useSensorReadings(id, 100);
    readings[id] = data || [];
  });

  // Merge into time-based data
  const timeMap = new Map<string, any>();
  deviceIds.forEach((id, i) => {
    (readings[id] || []).forEach((r) => {
      const time = new Date(r.recorded_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const existing = timeMap.get(time) || { time };
      existing[`power_${i}`] = r.power;
      timeMap.set(time, existing);
    });
  });
  const chartData = Array.from(timeMap.values());

  return (
    <div className="chart-container">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">Power Comparison</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} stroke="hsl(220 16% 18%)" />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} stroke="hsl(220 16% 18%)" />
          <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 10%)", border: "1px solid hsl(220 16% 18%)", borderRadius: "8px", fontSize: "12px" }} />
          <Legend />
          {deviceIds.map((id, i) => {
            const dev = devices.find((d) => d.id === id);
            return (
              <Line
                key={id}
                type="monotone"
                dataKey={`power_${i}`}
                name={dev?.name || id}
                stroke={COLORS[i]}
                strokeWidth={2}
                dot={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
