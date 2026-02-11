import { useEffect, useRef } from "react";
import { useDevices } from "@/hooks/useDevices";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  const { data: devices = [] } = useDevices();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current!, {
        center: [20.5937, 78.9629], // India center
        zoom: 5,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || devices.length === 0) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) map.removeLayer(layer);
      });

      devices.forEach((device) => {
        if (!device.lat || !device.lng) return;

        const statusColor =
          device.status === "online" ? "#22c55e" :
          device.status === "alert" ? "#ef4444" :
          device.status === "maintenance" ? "#f59e0b" :
          "#6b7280";

        L.circleMarker([device.lat, device.lng], {
          radius: 10,
          fillColor: statusColor,
          color: statusColor,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.4,
        })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: monospace; font-size: 12px;">
              <strong>${device.name}</strong><br/>
              <span style="color: ${statusColor};">● ${device.status?.toUpperCase()}</span><br/>
              Code: ${device.device_code}<br/>
              ${device.zone ? `Zone: ${device.zone}<br/>` : ""}
              ${device.location || ""}
            </div>
          `);
      });

      // Fit bounds if devices have coordinates
      const coords = devices.filter((d) => d.lat && d.lng).map((d) => [d.lat!, d.lng!] as [number, number]);
      if (coords.length > 0) {
        map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
      }
    });
  }, [devices]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Smart City Map</h1>
        <p className="text-sm text-muted-foreground">Live device locations with status indicators</p>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-energy-green" /> Online</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Maintenance</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Alert/Theft</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> Offline</span>
      </div>
      <div ref={mapRef} className="h-[calc(100vh-220px)] rounded-xl border border-border overflow-hidden" />
    </div>
  );
}
