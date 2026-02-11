import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  Map,
  Cpu,
  GitCompareArrows,
  Wrench,
  Users,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Map View", url: "/map", icon: Map },
  { title: "Compare", url: "/compare", icon: GitCompareArrows },
];

const manageNav = [
  { title: "Devices", url: "/devices", icon: Cpu },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Users", url: "/users", icon: Users },
];

export function AppSidebar() {
  const { signOut, profile, roles } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground">Smart Energy</h2>
          <p className="text-[10px] text-muted-foreground font-mono">IoT ANALYTICS</p>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Monitor
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{profile?.full_name || "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{roles[0] || "viewer"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
