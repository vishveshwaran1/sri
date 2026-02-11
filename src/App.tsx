import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DeviceProvider } from "@/hooks/useDevices";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import MapView from "./pages/MapView";
import DeviceCompare from "./pages/DeviceCompare";
import Devices from "./pages/Devices";
import Maintenance from "./pages/Maintenance";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DeviceProvider>
      <AppLayout />
    </DeviceProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/compare" element={<DeviceCompare />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
