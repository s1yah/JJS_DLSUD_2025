import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MapWidget } from "@/components/MapWidget";
import { BusCard } from "@/components/BusCard";
import { StatsCard } from "@/components/StatsCard";
import { Bus, Users, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data - in production, this would come from your backend
const mockBuses = [
  {
    id: "bus-1",
    name: "Bus 101",
    route: "Downtown - Airport",
    lat: 40.7128,
    lng: -74.006,
    passengers: 32,
    capacity: 40,
    eta: "12 min",
    status: "active" as const,
    location: "5th Avenue, Manhattan",
  },
  {
    id: "bus-2",
    name: "Bus 205",
    route: "Central - West End",
    lat: 40.7589,
    lng: -73.9851,
    passengers: 28,
    capacity: 40,
    eta: "8 min",
    status: "active" as const,
    location: "Times Square",
  },
  {
    id: "bus-3",
    name: "Bus 340",
    route: "North Loop Express",
    lat: 40.7489,
    lng: -73.9680,
    passengers: 38,
    capacity: 40,
    eta: "15 min",
    status: "delayed" as const,
    location: "Lexington Ave",
  },
];

const Index = () => {
  const [userRole, setUserRole] = useState<"admin" | "user">("admin");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationAdd = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  };

  return (
    <DashboardLayout role={userRole}>
      <div className="p-6 space-y-6">
        {/* Role Toggle */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setUserRole(userRole === "admin" ? "user" : "admin")}
            className="border-primary/50"
          >
            Switch to {userRole === "admin" ? "User" : "Admin"} View
          </Button>
        </div>

        {/* Stats Cards - Admin Only */}
        {userRole === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Active Buses"
              value={mockBuses.filter((b) => b.status === "active").length}
              icon={<Bus className="h-6 w-6" />}
              trend={{ value: 12, positive: true }}
              subtitle="Currently operational"
            />
            <StatsCard
              title="Total Passengers"
              value={mockBuses.reduce((sum, bus) => sum + bus.passengers, 0)}
              icon={<Users className="h-6 w-6" />}
              trend={{ value: 8, positive: true }}
              subtitle="Across all buses"
            />
            <StatsCard
              title="Avg ETA"
              value="11 min"
              icon={<Clock className="h-6 w-6" />}
              subtitle="System-wide average"
            />
            <StatsCard
              title="Efficiency"
              value="94%"
              icon={<TrendingUp className="h-6 w-6" />}
              trend={{ value: 3, positive: true }}
              subtitle="On-time performance"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Widget */}
          <div className="lg:col-span-2 h-[600px]">
            <MapWidget
              buses={mockBuses}
              userLocation={userLocation}
              onLocationAdd={userRole === "user" ? handleLocationAdd : undefined}
            />
          </div>

          {/* Bus List */}
          <div className="space-y-4 lg:h-[600px] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {userRole === "admin" ? "Fleet Overview" : "Nearby Buses"}
            </h2>
            {mockBuses.map((bus) => (
              <BusCard key={bus.id} {...bus} />
            ))}
          </div>
        </div>

        {/* User Location Info */}
        {userRole === "user" && userLocation && (
          <div className="bg-accent/10 border border-accent rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Your location set:</strong> {userLocation.lat.toFixed(4)},{" "}
              {userLocation.lng.toFixed(4)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Admins can now see your location on the map
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary-glow));
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Index;
