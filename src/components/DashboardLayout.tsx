import { ReactNode, useState } from "react";
import { Bus, MapPin, Users, Clock, Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  role?: "admin" | "user";
}

export const DashboardLayout = ({ children, role = "user" }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">BusTrack IoT</h1>
            <p className="text-xs text-muted-foreground">
              {role === "admin" ? "Admin Dashboard" : "Live Tracking"}
            </p>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="p-4 space-y-2">
          <SidebarLink icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active />
          <SidebarLink icon={<Bus className="h-5 w-5" />} label="Active Buses" />
          <SidebarLink icon={<MapPin className="h-5 w-5" />} label="Routes" />
          {role === "admin" && (
            <>
              <SidebarLink icon={<Users className="h-5 w-5" />} label="Analytics" />
              <SidebarLink icon={<Clock className="h-5 w-5" />} label="Schedule" />
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

const SidebarLink = ({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) => {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};
