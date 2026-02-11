import { LucideIcon } from "lucide-react";

export interface NavigationItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  comingSoon?: boolean;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}
