import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MapWidgetProps {
  buses?: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    passengers: number;
  }>;
  userLocation?: { lat: number; lng: number } | null;
  onLocationAdd?: (lat: number, lng: number) => void;
}

export const MapWidget = ({ buses = [], userLocation, onLocationAdd }: MapWidgetProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const initializeMap = () => {
    if (!mapContainer.current || !mapToken) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add click handler for users to set location
    if (onLocationAdd) {
      map.current.on("click", (e) => {
        onLocationAdd(e.lngLat.lat, e.lngLat.lng);
        toast.success("Location added successfully!");
      });
    }
  };

  useEffect(() => {
    if (isTokenSet) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, [isTokenSet]);

  // Update markers when buses change
  useEffect(() => {
    if (!map.current || !isTokenSet) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add bus markers
    buses.forEach((bus) => {
      const el = document.createElement("div");
      el.className = "bus-marker";
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="bg-primary rounded-full p-2 shadow-glow animate-pulse-glow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
              <circle cx="8" cy="16" r="1" />
              <circle cx="16" cy="16" r="1" />
            </svg>
          </div>
          <div class="bg-card text-card-foreground px-2 py-1 rounded text-xs mt-1 shadow-card">
            ${bus.name}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([bus.lng, bus.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-bold">${bus.name}</h3>
              <p>Passengers: ${bus.passengers}</p>
            </div>`
          )
        )
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    // Add user location marker if exists
    if (userLocation) {
      const el = document.createElement("div");
      el.className = "user-marker";
      el.innerHTML = `
        <div class="bg-accent rounded-full p-2 shadow-glow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      markersRef.current.push(marker);
    }
  }, [buses, userLocation, isTokenSet]);

  if (!isTokenSet) {
    return (
      <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border p-8">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2">
            <MapPin className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-xl font-bold text-foreground">Map Setup Required</h3>
            <p className="text-sm text-muted-foreground">
              Enter your Mapbox public token to enable the map widget. Get your token at{" "}
              <a
                href="https://mapbox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoiZXhhbXBsZS..."
              value={mapToken}
              onChange={(e) => setMapToken(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              onClick={() => {
                if (mapToken) {
                  setIsTokenSet(true);
                  toast.success("Map token set successfully!");
                } else {
                  toast.error("Please enter a valid token");
                }
              }}
              className="w-full"
            >
              Initialize Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-xl overflow-hidden border border-border shadow-card">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border shadow-card">
        <p className="text-sm text-muted-foreground">
          {onLocationAdd ? "Click on map to add your location" : "Real-time bus tracking"}
        </p>
      </div>
    </div>
  );
};
