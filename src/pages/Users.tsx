import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Eye, Wrench as WrenchIcon } from "lucide-react";

const roleConfig = {
  admin: { icon: Shield, color: "bg-destructive/20 text-destructive border-destructive/30" },
  technician: { icon: WrenchIcon, color: "bg-energy-cyan/20 text-energy-cyan border-energy-cyan/30" },
  viewer: { icon: Eye, color: "bg-muted text-muted-foreground border-border" },
};

export default function Users() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users_with_roles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*");
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("*");

      return (profiles || []).map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
      }));
    },
    enabled: isAdmin,
  });

  const changeRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: newRole as any,
      });
      if (error) throw error;
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["users_with_roles"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Admin access required to manage users.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage user roles and access</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {users.map((user: any) => {
            const role = user.roles[0] || "viewer";
            const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
            const _Icon = config.icon;
            return (
              <div key={user.id} className="metric-card metric-card-voltage flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                  {user.full_name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || "Unnamed"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <Select value={role} onValueChange={(v) => changeRole(user.user_id, v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
