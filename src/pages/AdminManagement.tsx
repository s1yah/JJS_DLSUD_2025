import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, UserPlus, ArrowLeft, Bus, Edit2, Check, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
}

interface BusConfiguration {
  id: string;
  bus_name: string;
  max_passengers: number;
  created_at: string;
  updated_at: string;
}

const AdminManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [busConfigs, setBusConfigs] = useState<BusConfiguration[]>([]);
  const [newBusName, setNewBusName] = useState("");
  const [newMaxPassengers, setNewMaxPassengers] = useState("");
  const [editingBus, setEditingBus] = useState<string | null>(null);
  const [editMaxPassengers, setEditMaxPassengers] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);

      // Check if user is admin
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (!data) {
        toast.error("Access denied: Admin only");
        navigate("/");
        return;
      }
      
      setIsAdmin(true);
      fetchUserRoles();
      fetchBusConfigs();
    };

    checkAuth();
  }, [navigate]);

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Failed to load user roles");
    } else {
      setUserRoles(data || []);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: newUserId.trim(),
        role: "admin",
      });

    if (error) {
      console.error("Error adding admin role:", error);
      toast.error(error.message || "Failed to add admin role");
    } else {
      toast.success("Admin role added successfully");
      setNewUserId("");
      fetchUserRoles();
    }
    setLoading(false);
  };

  const handleRemoveRole = async (roleId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed successfully");
      fetchUserRoles();
    }
  };

  const fetchBusConfigs = async () => {
    const { data, error } = await supabase
      .from("bus_configurations")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching bus configurations:", error);
      toast.error("Failed to load bus configurations");
    } else {
      setBusConfigs(data || []);
    }
  };

  const handleAddBusConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const maxPass = parseInt(newMaxPassengers);
    
    if (!newBusName.trim() || isNaN(maxPass) || maxPass <= 0) {
      toast.error("Please enter valid bus name and passenger count");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("bus_configurations")
      .insert({
        bus_name: newBusName.trim(),
        max_passengers: maxPass,
      });

    if (error) {
      console.error("Error adding bus configuration:", error);
      toast.error(error.message || "Failed to add bus configuration");
    } else {
      toast.success("Bus configuration added successfully");
      setNewBusName("");
      setNewMaxPassengers("");
      fetchBusConfigs();
    }
    setLoading(false);
  };

  const handleUpdateBusConfig = async (busId: string) => {
    const maxPass = parseInt(editMaxPassengers);
    
    if (isNaN(maxPass) || maxPass <= 0) {
      toast.error("Please enter valid passenger count");
      return;
    }

    const { error } = await supabase
      .from("bus_configurations")
      .update({ max_passengers: maxPass })
      .eq("id", busId);

    if (error) {
      console.error("Error updating bus configuration:", error);
      toast.error("Failed to update bus configuration");
    } else {
      toast.success("Bus configuration updated successfully");
      setEditingBus(null);
      setEditMaxPassengers("");
      fetchBusConfigs();
    }
  };

  const handleDeleteBusConfig = async (busId: string) => {
    const { error } = await supabase
      .from("bus_configurations")
      .delete()
      .eq("id", busId);

    if (error) {
      console.error("Error deleting bus configuration:", error);
      toast.error("Failed to delete bus configuration");
    } else {
      toast.success("Bus configuration deleted successfully");
      fetchBusConfigs();
    }
  };

  if (!user || !isAdmin) {
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Management</CardTitle>
            <CardDescription>
              Manage user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Admin Form */}
            <div className="border-b border-border pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Add Admin Role</h3>
              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <Input
                  placeholder="Enter user ID (from auth.users)"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Your user ID: <code className="bg-muted px-1 py-0.5 rounded">{user.id}</code>
              </p>
            </div>

            {/* User Roles List */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Current User Roles</h3>
              {userRoles.length > 0 ? (
                <div className="space-y-2">
                  {userRoles.map((userRole) => (
                    <div
                      key={userRole.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          User ID: {userRole.user_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Role: <span className="font-semibold">{userRole.role}</span>
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No user roles found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bus Seat Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Bus Seat Configuration
            </CardTitle>
            <CardDescription>
              Manage maximum passenger capacity for each bus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Bus Configuration Form */}
            <div className="border-b border-border pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Add New Bus</h3>
              <form onSubmit={handleAddBusConfig} className="flex gap-2">
                <Input
                  placeholder="Bus name (e.g., Bus 101)"
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max passengers"
                  value={newMaxPassengers}
                  onChange={(e) => setNewMaxPassengers(e.target.value)}
                  className="w-32"
                  min="1"
                />
                <Button type="submit" disabled={loading}>
                  <Bus className="h-4 w-4 mr-2" />
                  Add Bus
                </Button>
              </form>
            </div>

            {/* Bus Configurations List */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Current Bus Configurations</h3>
              {busConfigs.length > 0 ? (
                <div className="space-y-2">
                  {busConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {config.bus_name}
                        </p>
                        {editingBus === config.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              value={editMaxPassengers}
                              onChange={(e) => setEditMaxPassengers(e.target.value)}
                              className="w-32 h-8"
                              min="1"
                              placeholder="Max passengers"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateBusConfig(config.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingBus(null);
                                setEditMaxPassengers("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Max Passengers: <span className="font-semibold">{config.max_passengers}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingBus !== config.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBus(config.id);
                              setEditMaxPassengers(config.max_passengers.toString());
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBusConfig(config.id)}
                          disabled={editingBus === config.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bus configurations found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Users must first sign up through the /auth page</p>
            <p>2. Copy their user ID from the browser console after login (auth.uid())</p>
            <p>3. Add their user ID here to grant admin privileges</p>
            <p>4. Admins can view all passenger locations and bus ETAs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminManagement;
