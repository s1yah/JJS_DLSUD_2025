import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MapWidget } from "@/components/MapWidget";
import { BusCard } from "@/components/BusCard";
import { StatsCard } from "@/components/StatsCard";
import { Bus, Users, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [userRole, setUserRole] = useState<"admin" | "user">("admin");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [buses, setBuses] = useState<Array<{
    id: string;
    name: string;
    route: string;
    lat: number;
    lng: number;
    passengers: number;
    capacity: number;
    eta: string;
    status: "active" | "delayed";
    location: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        const response = await fetch(
          "https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/458fd2c0-889a-11f0-8c95-7536037a85df/values/timeseries?keys=latitude%2Clongitude%2CpeopleCount&useStrictDataTypes=false",
          {
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhcGl1c2VyQGdtYWlsLmNvbSIsInVzZXJJZCI6IjBhZjcwOWQwLWJjNmItMTFmMC05ZGFjLWYxNGFhN2Y3NTU5ZiIsInNjb3BlcyI6WyJDVVNUT01FUl9VU0VSIl0sInNlc3Npb25JZCI6IjFjNzIwZmFmLTQ3Y2QtNGQxNS04MmJjLWY2ODkzNDQzY2Q0MyIsImV4cCI6MTc2NDQwNDk1NCwiaXNzIjoidGhpbmdzYm9hcmQuaW8iLCJpYXQiOjE3NjI2MDQ5NTQsImZpcnN0TmFtZSI6IkFQSSIsImxhc3ROYW1lIjoiVXNlciIsImVuYWJsZWQiOnRydWUsInByaXZhY3lQb2xpY3lBY2NlcHRlZCI6ZmFsc2UsImlzUHVibGljIjpmYWxzZSwidGVuYW50SWQiOiIwMjcxOGQxMC04MGZlLTExZjAtYTliNS03OTJlMjE5NGE1ZDQiLCJjdXN0b21lcklkIjoiMDQ5YTg3OTAtODBmZS0xMWYwLWE5YjUtNzkyZTIxOTRhNWQ0In0.OCGyYppcDJhm1pmmyJNz6Ma0iZymLVAGs74MxbxbdO4u_tdvlzvcf6IQvjEtrEONKDMBiEe2T3QW3-Vxf0riJQ'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch bus data");
        }

        const data = await response.json();
        
        // Transform API data to bus format
        const latitude = data.latitude?.[0]?.value ? parseFloat(data.latitude[0].value) : 40.7128;
        const longitude = data.longitude?.[0]?.value ? parseFloat(data.longitude[0].value) : -74.006;
        const peopleCount = data.peopleCount?.[0]?.value ? parseInt(data.peopleCount[0].value) : 0;

        const transformedBuses = [
          {
            id: "bus-1",
            name: "Bus 101",
            route: "Live Route",
            lat: latitude,
            lng: longitude,
            passengers: peopleCount,
            capacity: 40,
            eta: "Live",
            status: "active" as const,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          },
        ];

        setBuses(transformedBuses);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching bus data:", error);
        toast.error("Failed to load bus data");
        setIsLoading(false);
      }
    };

    fetchBusData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchBusData, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
              value={buses.filter((b) => b.status === "active").length}
              icon={<Bus className="h-6 w-6" />}
              trend={{ value: 12, positive: true }}
              subtitle="Currently operational"
            />
            <StatsCard
              title="Total Passengers"
              value={buses.reduce((sum, bus) => sum + bus.passengers, 0)}
              icon={<Users className="h-6 w-6" />}
              trend={{ value: 8, positive: true }}
              subtitle="Across all buses"
            />
            <StatsCard
              title="Avg ETA"
              value="Live"
              icon={<Clock className="h-6 w-6" />}
              subtitle="Real-time tracking"
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
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border">
                <div className="text-center space-y-2">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading bus data...</p>
                </div>
              </div>
            ) : (
              <MapWidget
                buses={buses}
                userLocation={userLocation}
                onLocationAdd={userRole === "user" ? handleLocationAdd : undefined}
              />
            )}
          </div>

          {/* Bus List */}
          <div className="space-y-4 lg:h-[600px] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {userRole === "admin" ? "Fleet Overview" : "Nearby Buses"}
            </h2>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Loading buses...</p>
              </div>
            ) : buses.length > 0 ? (
              buses.map((bus) => (
                <BusCard key={bus.id} {...bus} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No buses available</p>
              </div>
            )}
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
