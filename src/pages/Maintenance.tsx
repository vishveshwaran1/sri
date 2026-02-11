import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDevices } from "@/hooks/useDevices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";
import { useState } from "react";

export default function Maintenance() {
  const { user, isTechnician, isAdmin } = useAuth();
  const { data: devices = [] } = useDevices();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["maintenance_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*, devices(name, device_code)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from("maintenance_logs").insert({
        device_id: form.get("device_id") as string,
        user_id: user!.id,
        action: form.get("action") as string,
        notes: form.get("notes") as string || null,
      });
      if (error) throw error;
      toast.success("Maintenance log added");
      queryClient.invalidateQueries({ queryKey: ["maintenance_logs"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Maintenance & Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track repairs, replacements, and inspections</p>
        </div>
        {(isTechnician || isAdmin) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Log</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Maintenance Log</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Device</Label>
                  <Select name="device_id" required>
                    <SelectTrigger><SelectValue placeholder="Select device" /></SelectTrigger>
                    <SelectContent>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name} ({d.device_code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Action</Label>
                  <Input name="action" placeholder="Sensor replaced" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea name="notes" placeholder="Additional details..." />
                </div>
                <Button type="submit" className="w-full">Add Log</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="chart-container flex items-center justify-center h-40 text-muted-foreground">
          No maintenance logs yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="metric-card metric-card-current flex items-start gap-3">
              <Wrench className="h-4 w-4 text-energy-cyan mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{log.action}</span>
                  {log.devices && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {log.devices.name}
                    </span>
                  )}
                </div>
                {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
