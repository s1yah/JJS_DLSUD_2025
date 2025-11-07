import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
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

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

const mapOptions = {
  styles: [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#1a1f2e" }],
    },
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#8b92a3" }],
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1a1f2e" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0f1419" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#2a3142" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#1f2534" }],
    },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

// API Key Input Component
const ApiKeyInput = ({ onSubmit }: { onSubmit: (key: string) => void }) => {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border p-8">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-xl font-bold text-foreground">Map Setup Required</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Google Maps API key to enable the map widget. Get your key at{" "}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure to enable Maps JavaScript API and Routes API in your Google Cloud project.
          </p>
        </div>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            onClick={() => {
              if (apiKey.trim()) {
                onSubmit(apiKey.trim());
                toast.success("Google Maps API key set successfully!");
              } else {
                toast.error("Please enter a valid API key");
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
};

// Map Component - Only rendered when API key is set
const MapComponent = ({ 
  apiKey, 
  buses, 
  userLocation, 
  onLocationAdd,
  isLoaded
}: MapWidgetProps & { apiKey: string; isLoaded: boolean }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [routes, setRoutes] = useState<Array<{ path: google.maps.LatLngLiteral[]; busId: string }>>([]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onLocationAdd && e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationAdd(lat, lng);
        toast.success("Location added successfully!");
      }
    },
    [onLocationAdd]
  );

  // Decode Google's encoded polyline format
  const decodePolyline = (encoded: string): google.maps.LatLngLiteral[] => {
    const poly: google.maps.LatLngLiteral[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return poly;
  };

  // Calculate routes using Google Routes API
  const calculateRoutes = useCallback(async () => {
    if (!userLocation || !buses || buses.length === 0) return;

    const newRoutes: Array<{ path: google.maps.LatLngLiteral[]; busId: string }> = [];

    for (const bus of buses) {
      try {
        const response = await fetch(
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
            },
            body: JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude: bus.lat,
                    longitude: bus.lng,
                  },
                },
              },
              destination: {
                location: {
                  latLng: {
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                  },
                },
              },
              travelMode: "DRIVE",
              routingPreference: "TRAFFIC_AWARE",
              computeAlternativeRoutes: false,
              languageCode: "en-US",
              units: "IMPERIAL",
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const encodedPolyline = data.routes[0].polyline.encodedPolyline;
            const decodedPath = decodePolyline(encodedPolyline);
            newRoutes.push({ path: decodedPath, busId: bus.id });
          }
        }
      } catch (error) {
        console.error(`Error calculating route for bus ${bus.id}:`, error);
      }
    }

    setRoutes(newRoutes);
  }, [apiKey, buses, userLocation]);

  useEffect(() => {
    if (userLocation && buses && buses.length > 0) {
      calculateRoutes();
    }
  }, [userLocation, buses, calculateRoutes]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-xl overflow-hidden border border-border shadow-card">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {/* Bus Markers */}
        {buses && buses.map((bus) => (
          <Marker
            key={bus.id}
            position={{ lat: bus.lat, lng: bus.lng }}
            title={bus.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#3b9bde",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            label={{
              text: "🚌",
              fontSize: "20px",
            }}
          />
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            title="Your Location"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            label={{
              text: "📍",
              fontSize: "18px",
            }}
          />
        )}

        {/* Route Polylines */}
        {routes.map((route, index) => (
          <Polyline
            key={`route-${route.busId}-${index}`}
            path={route.path}
            options={{
              strokeColor: "#3b9bde",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        ))}
      </GoogleMap>

      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border shadow-card">
        <p className="text-sm text-muted-foreground">
          {onLocationAdd ? "Click on map to add your location" : "Real-time bus tracking with routes"}
        </p>
        {routes.length > 0 && (
          <p className="text-xs text-accent mt-1">
            Showing {routes.length} route{routes.length !== 1 ? "s" : ""} to your location
          </p>
        )}
      </div>
    </div>
  );
};

// Wrapper component that handles Google Maps loading
const MapWithLoader = ({ apiKey, buses, userLocation, onLocationAdd }: MapWidgetProps & { apiKey: string }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
  });

  return (
    <MapComponent
      apiKey={apiKey}
      buses={buses}
      userLocation={userLocation}
      onLocationAdd={onLocationAdd}
      isLoaded={isLoaded}
    />
  );
};

// Main MapWidget Component
export const MapWidget = ({ buses = [], userLocation, onLocationAdd }: MapWidgetProps) => {
  const [confirmedApiKey, setConfirmedApiKey] = useState<string | null>(null);

  if (!confirmedApiKey) {
    return <ApiKeyInput onSubmit={setConfirmedApiKey} />;
  }

  return (
    <MapWithLoader
      apiKey={confirmedApiKey}
      buses={buses}
      userLocation={userLocation}
      onLocationAdd={onLocationAdd}
    />
  );
};
