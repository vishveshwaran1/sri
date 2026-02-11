import { useAllAlerts } from "@/hooks/useRealtimeReadings";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Lightbulb, AlertTriangle } from "lucide-react";

const typeConfig = {
  theft: { icon: ShieldAlert, color: "bg-destructive/20 text-destructive border-destructive/30" },
  wastage: { icon: Lightbulb, color: "bg-warning/20 text-warning border-warning/30" },
  anomaly: { icon: AlertTriangle, color: "bg-energy-purple/20 text-energy-purple border-energy-purple/30" },
};

const severityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-energy-amber/20 text-energy-amber",
  high: "bg-destructive/20 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

export default function Alerts() {
  const { data: alerts = [], isLoading } = useAllAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Alert Center</h1>
        <p className="text-sm text-muted-foreground">Real-time theft, wastage, and anomaly alerts</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <div className="chart-container flex items-center justify-center h-40 text-muted-foreground">
          No alerts yet. Alerts will appear here in real-time.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert: any) => {
            const config = typeConfig[alert.type as keyof typeof typeConfig];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${config.color}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold font-mono uppercase">{alert.type}</span>
                    <Badge className={`text-[10px] ${severityColor[alert.severity]}`}>
                      {alert.severity}
                    </Badge>
                    {alert.devices && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {alert.devices.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </p>
                </div>
                {alert.acknowledged && (
                  <Badge variant="outline" className="text-[10px] border-energy-green/30 text-energy-green">ACK</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
