import { Bus, Users, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BusCardProps {
  id: string;
  name: string;
  route: string;
  passengers: number;
  capacity: number;
  eta: string;
  status: "active" | "delayed" | "offline";
  location: string;
}

export const BusCard = ({
  name,
  route,
  passengers,
  capacity,
  eta,
  status,
  location,
}: BusCardProps) => {
  const statusColors = {
    active: "bg-success text-success-foreground",
    delayed: "bg-warning text-warning-foreground",
    offline: "bg-muted text-muted-foreground",
  };

  const occupancyPercentage = (passengers / capacity) * 100;
  const occupancyColor =
    occupancyPercentage > 80 ? "bg-warning" : occupancyPercentage > 50 ? "bg-primary" : "bg-success";

  return (
    <Card className="p-4 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 animate-slide-in group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Bus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{route}</p>
          </div>
        </div>
        <Badge className={statusColors[status]}>{status}</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">{location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {passengers}/{capacity}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">ETA: {eta}</span>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Occupancy</span>
            <span>{occupancyPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${occupancyColor} transition-all duration-500 rounded-full`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
