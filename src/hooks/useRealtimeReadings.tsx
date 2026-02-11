import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

export type SensorReading = Tables<"sensor_readings">;

export function useSensorReadings(deviceId: string | null, limit = 200) {
  return useQuery({
    queryKey: ["sensor_readings", deviceId, limit],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .eq("device_id", deviceId)
        .order("recorded_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).reverse();
    },
    enabled: !!deviceId,
    refetchInterval: 30000,
  });
}

export function useRealtimeReadings(deviceId: string | null) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`readings-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newReading = payload.new as SensorReading;
          setLatestReading(newReading);
          // Update the query cache
          queryClient.setQueryData(
            ["sensor_readings", deviceId, 200],
            (old: SensorReading[] | undefined) => {
              if (!old) return [newReading];
              const updated = [...old, newReading];
              return updated.slice(-200);
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, queryClient]);

  return latestReading;
}

export function useRealtimeAlerts(deviceId: string | null) {
  const queryClient = useQueryClient();
  const [latestAlert, setLatestAlert] = useState<Tables<"alerts"> | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`alerts-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newAlert = payload.new as Tables<"alerts">;
          setLatestAlert(newAlert);
          queryClient.invalidateQueries({ queryKey: ["alerts"] });

          // Browser notification for theft
          if (newAlert.type === "theft" && Notification.permission === "granted") {
            new Notification("⚠️ THEFT DETECTED!", {
              body: newAlert.message || "Energy theft detected on your device",
              icon: "/favicon.ico",
              tag: "theft-alert",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, queryClient]);

  return latestAlert;
}

export function useAlerts(deviceId: string | null) {
  return useQuery({
    queryKey: ["alerts", deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Tables<"alerts">[];
    },
    enabled: !!deviceId,
  });
}

export function useAllAlerts() {
  return useQuery({
    queryKey: ["alerts", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*, devices(name, device_code)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
