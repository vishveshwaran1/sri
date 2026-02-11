import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import { AlertTriangle, ShieldAlert, Lightbulb, X } from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  alert: Tables<"alerts"> | null;
}

const alertConfig = {
  theft: { icon: ShieldAlert, className: "alert-theft", label: "THEFT DETECTED" },
  wastage: { icon: Lightbulb, className: "alert-wastage", label: "WASTAGE DETECTED" },
  anomaly: { icon: AlertTriangle, className: "alert-theft", label: "ANOMALY DETECTED" },
};

export function AlertBanner({ alert }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!alert || dismissed) return null;

  const config = alertConfig[alert.type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${config.className} rounded-lg p-3 flex items-center gap-3`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold font-mono">{config.label}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(alert.created_at).toLocaleTimeString()}
        </span>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
