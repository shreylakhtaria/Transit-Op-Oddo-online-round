import {
  LayoutGrid,
  Truck,
  Users,
  Route,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Fleet", href: "/fleet", icon: Truck },
  { label: "Drivers", href: "/drivers", icon: Users },
  { label: "Trips", href: "/trips", icon: Route },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Fuel & Expenses", href: "/fuel", icon: Receipt },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];
