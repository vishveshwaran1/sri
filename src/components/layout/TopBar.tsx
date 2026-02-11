import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDevices, useSelectedDevice } from "@/hooks/useDevices";
import { Badge } from "@/components/ui/badge";
import { Bell, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function TopBar() {
  const { data: devices } = useDevices();
  const { selectedDeviceId, setSelectedDeviceId } = useSelectedDevice();
  const [notifPermission, setNotifPermission] = useState(Notification.permission);

  // Auto-select first device
  useEffect(() => {
    if (!selectedDeviceId && devices && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId, setSelectedDeviceId]);

  const enableNotifications = async () => {
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const selectedDevice = devices?.find((d) => d.id === selectedDeviceId);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4">
      <SidebarTrigger />

      <div className="flex-1 flex items-center gap-4">
        <Select value={selectedDeviceId || ""} onValueChange={setSelectedDeviceId}>
          <SelectTrigger className="w-[240px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            {devices?.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                <span className="flex items-center gap-2">
                  {d.status === "online" ? (
                    <Wifi className="h-3 w-3 text-energy-green" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                  )}
                  {d.name}
                  <span className="text-muted-foreground font-mono text-[10px]">{d.device_code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDevice && (
          <Badge
            variant="outline"
            className={`text-[10px] font-mono ${
              selectedDevice.status === "online"
                ? "border-energy-green/30 text-energy-green"
                : selectedDevice.status === "alert"
                ? "border-destructive/30 text-destructive"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            {selectedDevice.status?.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {notifPermission !== "granted" && (
          <button
            onClick={enableNotifications}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
          >
            <Bell className="h-3.5 w-3.5" />
            Enable Alerts
          </button>
        )}
      </div>
    </header>
  );
}
