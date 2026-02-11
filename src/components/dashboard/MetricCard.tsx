import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  variant: "voltage" | "current" | "power" | "ldr" | "pir";
  trend?: "up" | "down" | "stable";
}

const variantColors: Record<string, string> = {
  voltage: "text-energy-blue",
  current: "text-energy-cyan",
  power: "text-energy-green",
  ldr: "text-energy-amber",
  pir: "text-energy-purple",
};

export function MetricCard({ title, value, unit, icon: Icon, variant }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`metric-card metric-card-${variant}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{title}</p>
        </div>
        <div className={`p-2 rounded-lg bg-secondary/50 ${variantColors[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold font-mono ${variantColors[variant]}`}>
          {typeof value === "number" ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </motion.div>
  );
}
