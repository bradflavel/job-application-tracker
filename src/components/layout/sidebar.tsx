import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  LineChart,
  BellRing,
  Scale,
  Archive,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/apps", label: "Applications", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/reminders", label: "Reminders", icon: BellRing },
  { to: "/offers/compare", label: "Offers", icon: Scale },
  { to: "/archive", label: "Archive", icon: Archive },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground",
            )
          }
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
