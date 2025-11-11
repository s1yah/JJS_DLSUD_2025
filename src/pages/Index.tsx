import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapWidget } from "@/components/MapWidget";
import { BusCard } from "@/components/BusCard";
import { StatsCard } from "@/components/StatsCard";
import { Bus, Users, MapPin, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Destination coordinates
const DESTINATIONS = {
  PITX: { lat: 14.4515, lng: 120.9894, name: "PITX" },
  SM_DASMARINAS: { lat: 14.3294, lng: 120.9367, name: "SM Dasmariñas" },
} as const;

type DestinationKey = keyof typeof DESTINATIONS;

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<DestinationKey>("PITX");
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [userLocations, setUserLocations] = useState<Array<{ id: string; lat: number; lng: number; user_id: string }>>([]);
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

  // Check authentication
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    const checkAdminRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
    };

    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (!session) return;

    const fetchBusData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/thingsboard-proxy`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
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

        // Calculate ETA if Google Maps API key is available
        let eta = "Calculating...";
        if (googleMapsApiKey && isAdmin) {
          const destination = DESTINATIONS[selectedDestination];
          eta = await calculateETA(latitude, longitude, destination.lat, destination.lng, googleMapsApiKey);
        }

        const transformedBuses = [
          {
            id: "bus-1",
            name: "Bus 101",
            route: "Live Route",
            lat: latitude,
            lng: longitude,
            passengers: peopleCount,
            capacity: 40,
            eta,
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
  }, [session, googleMapsApiKey, selectedDestination, isAdmin]);

  // Calculate ETA using Google Routes API
  const calculateETA = async (busLat: number, busLng: number, destLat: number, destLng: number, apiKey: string) => {
    try {
      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: busLat,
                  longitude: busLng,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destLat,
                  longitude: destLng,
                },
              },
            },
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          const durationSeconds = parseInt(data.routes[0].duration.replace('s', ''));
          const minutes = Math.round(durationSeconds / 60);
          return `${minutes} min`;
        }
      }
      return "N/A";
    } catch (error) {
      console.error("Error calculating ETA:", error);
      return "N/A";
    }
  };

  // Fetch user locations from database
  useEffect(() => {
    if (!session) return;

    const fetchUserLocations = async () => {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching user locations:", error);
      } else if (data) {
        setUserLocations(data);
      }
    };

    fetchUserLocations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user_locations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations'
        },
        (payload) => {
          console.log('User location changed:', payload);
          fetchUserLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleLocationAdd = async (lat: number, lng: number) => {
    if (!user) return;
    
    setUserLocation({ lat, lng });

    const { error } = await supabase
      .from('user_locations')
      .upsert({
        user_id: user.id,
        lat,
        lng,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } else {
      toast.success("Location saved and visible to drivers!");
    }
  };

  const handleLocationRemove = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('user_locations')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error("Error removing location:", error);
      toast.error("Failed to remove location");
    } else {
      setUserLocation(null);
      toast.success("Location removed successfully");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center px-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">BusTrack IoT</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Admin Dashboard" : "Live Tracking"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/admin")} size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Destination Selector - Admin Only */}
        {isAdmin && (
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1 block">
                Select Destination
              </label>
              <Select
                value={selectedDestination}
                onValueChange={(value: DestinationKey) => setSelectedDestination(value)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PITX">PITX</SelectItem>
                  <SelectItem value="SM_DASMARINAS">SM Dasmariñas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              ETAs calculated to: <span className="font-semibold text-foreground">{DESTINATIONS[selectedDestination].name}</span>
            </div>
          </div>
        )}

        {/* Stats Cards - Admin Only */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Widget */}
          <div className="lg:col-span-2 h-[600px]">
            <MapWidget
              buses={buses}
              userLocation={userLocation}
              userLocations={userLocations}
              onLocationAdd={!isAdmin ? handleLocationAdd : undefined}
              onApiKeySet={setGoogleMapsApiKey}
            />
          </div>

          {/* Bus List */}
          <div className="space-y-4 lg:h-[600px] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isAdmin ? "Fleet Overview" : "Nearby Buses"}
            </h2>
            {buses.length > 0 ? (
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
        {!isAdmin && userLocation && (
          <div className="bg-accent/10 border border-accent rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <strong>Your location set:</strong> {userLocation.lat.toFixed(4)},{" "}
                  {userLocation.lng.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drivers can now see your location on the map
                </p>
              </div>
              <Button
                onClick={handleLocationRemove}
                variant="destructive"
                size="sm"
              >
                Remove Location
              </Button>
            </div>
          </div>
        )}

        {/* Admin view: Show number of passenger locations */}
        {isAdmin && userLocations.length > 0 && (
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Tracking {userLocations.length} passenger location{userLocations.length !== 1 ? 's' : ''}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Passenger markers are visible on the map in real-time
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
    </div>
  );
};

export default Index;
