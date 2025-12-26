import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  Wrench,
  UserCircle,
  Home,
  Construction,
  FileText,
  FolderOpen,
  LineChart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Leads", url: "/leads", icon: TrendingUp },
  { title: "Sales", url: "/sales", icon: DollarSign },
  { title: "Quotations", url: "/quotations", icon: FileText },
  { title: "Finance", url: "/finance", icon: BarChart3 },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Tenants", url: "/tenants", icon: Home },
  { title: "Site Progress", url: "/site-progress", icon: Construction },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Market Insights", url: "/market-insights", icon: LineChart },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarHeader className={`border-b border-sidebar-border ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`flex items-center justify-center rounded-lg bg-primary shadow-md ${isCollapsed ? 'h-9 w-9' : 'h-10 w-10'}`}>
            <Building2 className={`text-white ${isCollapsed ? 'h-5 w-5' : 'h-6 w-6'}`} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-sidebar-foreground tracking-tight truncate">
                Eduvanca
              </h1>
              <p className="text-xs text-sidebar-foreground/70">Realestates</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={isCollapsed ? 'p-2' : 'p-3'}>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/70 mb-2 text-xs">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={0}>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end={item.url === "/"}
                              className={({ isActive }) =>
                                `flex items-center justify-center rounded-lg p-2.5 transition-all ${
                                  isActive
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                }`
                              }
                            >
                              <item.icon className="h-5 w-5" />
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
