import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { createContext, useContext, useState, ReactNode } from "react";

interface DeviceContextType {
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
}

const DeviceContext = createContext<DeviceContextType>({
  selectedDeviceId: null,
  setSelectedDeviceId: () => {},
});

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  return (
    <DeviceContext.Provider value={{ selectedDeviceId, setSelectedDeviceId }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useSelectedDevice() {
  return useContext(DeviceContext);
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devices").select("*").order("name");
      if (error) throw error;
      return data as Tables<"devices">[];
    },
  });
}
