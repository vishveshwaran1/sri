import { useDevices } from "@/hooks/useDevices";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Devices() {
  const { data: devices = [], isLoading } = useDevices();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const handleAddDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const apiKey = crypto.randomUUID();

    try {
      const { data: device, error } = await supabase.from("devices").insert({
        device_code: form.get("code") as string,
        name: form.get("name") as string,
        location: form.get("location") as string || null,
        lat: form.get("lat") ? parseFloat(form.get("lat") as string) : null,
        lng: form.get("lng") ? parseFloat(form.get("lng") as string) : null,
        zone: form.get("zone") as string || null,
      }).select().single();

      if (error) throw error;

      // Create API key for device
      await supabase.from("device_api_keys").insert({
        device_id: device.id,
        api_key: apiKey,
      });

      toast.success(`Device added! API Key: ${apiKey}`, { duration: 15000 });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusStyles: Record<string, string> = {
    online: "border-energy-green/30 text-energy-green",
    offline: "border-muted-foreground/30 text-muted-foreground",
    maintenance: "border-warning/30 text-warning",
    alert: "border-destructive/30 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Devices</h1>
          <p className="text-sm text-muted-foreground">Manage IoT sensor nodes (ESP32)</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Device</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register New Device</DialogTitle></DialogHeader>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Device Code</Label>
                    <Input name="code" placeholder="ESP32-001" required className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input name="name" placeholder="Street Light #1" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input name="location" placeholder="Gate 2, Main Road" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Latitude</Label>
                    <Input name="lat" type="number" step="any" placeholder="20.59" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Longitude</Label>
                    <Input name="lng" type="number" step="any" placeholder="78.96" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Zone</Label>
                    <Input name="zone" placeholder="Zone A" />
                  </div>
                </div>
                <Button type="submit" className="w-full">Register Device</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : devices.length === 0 ? (
        <div className="chart-container flex items-center justify-center h-40 text-muted-foreground">
          No devices registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="metric-card metric-card-voltage">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-sm">{d.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground">{d.device_code}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] font-mono ${statusStyles[d.status]}`}>
                  {d.status === "online" ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                  {d.status}
                </Badge>
              </div>
              {d.location && <p className="text-xs text-muted-foreground">{d.location}</p>}
              {d.zone && <p className="text-[10px] text-muted-foreground font-mono">Zone: {d.zone}</p>}
              {d.lat && d.lng && (
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  📍 {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ESP32 Connection Guide */}
      <div className="chart-container">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">ESP32 WiFi Connection Guide</h3>
        <div className="text-xs text-muted-foreground space-y-2 font-mono">
          <p>1. Register your device above to get an API key</p>
          <p>2. Flash your ESP32 with the sensor reading firmware</p>
          <p>3. Configure WiFi credentials on the ESP32</p>
          <p>4. POST data to the ingestion endpoint:</p>
          <div className="bg-secondary/50 rounded-lg p-3 mt-2">
            <p className="text-energy-blue">POST {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-sensor-data`}</p>
            <p className="text-muted-foreground mt-1">Headers: x-api-key: YOUR_DEVICE_API_KEY</p>
            <p className="text-muted-foreground">Content-Type: application/json</p>
            <p className="text-energy-green mt-2">{`{"voltage": 230.5, "current": 1.2, "power": 276.6, "ldr": 450, "pir": 1}`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
