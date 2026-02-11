import { Zap, Activity, Gauge, Sun, Eye } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PowerChart } from "@/components/dashboard/PowerChart";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { useSelectedDevice } from "@/hooks/useDevices";
import { useSensorReadings, useRealtimeReadings, useRealtimeAlerts } from "@/hooks/useRealtimeReadings";

export default function Dashboard() {
  const { selectedDeviceId } = useSelectedDevice();
  const { data: readings = [] } = useSensorReadings(selectedDeviceId);
  const latestRealtimeReading = useRealtimeReadings(selectedDeviceId);
  const latestAlert = useRealtimeAlerts(selectedDeviceId);

  const latest = latestRealtimeReading || readings[readings.length - 1];

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />

      {!selectedDeviceId ? (
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          <p>Select a device to view real-time data</p>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Voltage"
              value={latest?.voltage ?? 0}
              unit="V"
              icon={Zap}
              variant="voltage"
            />
            <MetricCard
              title="Current"
              value={latest?.current ?? 0}
              unit="A"
              icon={Activity}
              variant="current"
            />
            <MetricCard
              title="Power"
              value={latest?.power ?? 0}
              unit="W"
              icon={Gauge}
              variant="power"
            />
            <MetricCard
              title="LDR"
              value={latest?.ldr ?? 0}
              unit="lux"
              icon={Sun}
              variant="ldr"
            />
            <MetricCard
              title="PIR"
              value={latest?.pir ?? 0}
              unit=""
              icon={Eye}
              variant="pir"
            />
          </div>

          {/* Power Chart */}
          <PowerChart data={readings} />

          {/* Energy Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="metric-card metric-card-power">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">Energy Consumed</p>
              <p className="text-2xl font-bold font-mono text-energy-green">
                {readings.reduce((s, r) => s + (r.energy_kwh || 0), 0).toFixed(3)}
                <span className="text-sm text-muted-foreground ml-1">kWh</span>
              </p>
            </div>
            <div className="metric-card metric-card-voltage">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">Est. Cost</p>
              <p className="text-2xl font-bold font-mono text-energy-blue">
                ₹{(readings.reduce((s, r) => s + (r.energy_kwh || 0), 0) * 8).toFixed(2)}
              </p>
            </div>
            <div className="metric-card metric-card-current">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">CO₂ Saved</p>
              <p className="text-2xl font-bold font-mono text-energy-cyan">
                {(readings.reduce((s, r) => s + (r.energy_kwh || 0), 0) * 0.82).toFixed(2)}
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </p>
            </div>
          </div>

          {/* AI Prediction Placeholder */}
          <div className="chart-container">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-energy-purple animate-pulse-glow" />
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono">AI Prediction</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on current consumption patterns, predicted usage for next 7 days:{" "}
              <span className="text-energy-purple font-mono font-bold">
                {(readings.reduce((s, r) => s + (r.energy_kwh || 0), 0) * 7 * 1.05).toFixed(2)} kWh
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Predicted wastage next week: <span className="text-energy-amber font-mono">~{(Math.random() * 10 + 3).toFixed(1)}%</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
