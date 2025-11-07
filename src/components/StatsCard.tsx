import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  subtitle?: string;
}

export const StatsCard = ({ title, value, icon, trend, subtitle }: StatsCardProps) => {
  return (
    <Card className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 animate-slide-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground mb-2">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium mt-2 ${
                trend.positive ? "text-success" : "text-warning"
              }`}
            >
              {trend.positive ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary">{icon}</div>
        </div>
      </div>
    </Card>
  );
};
