import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Check, X, AlertCircle, Calendar, DollarSign, Users, Wrench, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isAfter, subDays } from "date-fns";

interface Notification {
  id: string;
  type: 'lead' | 'payment' | 'maintenance' | 'lease' | 'property';
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: any;
  color: string;
}

export function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const notifs: Notification[] = [];

    // Fetch follow-up leads due today or overdue
    const { data: leads } = await supabase
      .from("leads")
      .select("id, lead_name, follow_up_date, status")
      .eq("user_id", user.id)
      .not("follow_up_date", "is", null)
      .in("status", ["new", "contacted", "qualified", "negotiating"]);

    leads?.forEach(lead => {
      if (lead.follow_up_date) {
        const followUp = new Date(lead.follow_up_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (followUp <= today) {
          notifs.push({
            id: `lead-${lead.id}`,
            type: 'lead',
            title: 'Lead Follow-up Due',
            description: `Follow up with ${lead.lead_name || 'Unknown'}`,
            time: format(followUp, 'MMM dd'),
            read: false,
            icon: Users,
            color: 'text-blue-500'
          });
        }
      }
    });

    // Fetch overdue payments
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, due_date, status")
      .eq("user_id", user.id)
      .eq("status", "overdue");

    payments?.forEach(payment => {
      notifs.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: 'Overdue Payment',
        description: `₹${payment.amount.toLocaleString('en-IN')} overdue`,
        time: payment.due_date ? format(new Date(payment.due_date), 'MMM dd') : 'N/A',
        read: false,
        icon: DollarSign,
        color: 'text-red-500'
      });
    });

    // Fetch pending maintenance
    const { data: maintenance } = await supabase
      .from("maintenance_requests")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    maintenance?.forEach(req => {
      notifs.push({
        id: `maint-${req.id}`,
        type: 'maintenance',
        title: 'Pending Maintenance',
        description: req.title,
        time: format(new Date(req.created_at), 'MMM dd'),
        read: false,
        icon: Wrench,
        color: 'text-orange-500'
      });
    });

    // Fetch lease renewals due within 30 days
    const thirtyDaysFromNow = subDays(new Date(), -30);
    const { data: leases } = await supabase
      .from("tenant_management")
      .select("id, lease_end_date, tenant_id")
      .eq("user_id", user.id)
      .eq("lease_status", "active")
      .lte("lease_end_date", format(thirtyDaysFromNow, 'yyyy-MM-dd'))
      .gte("lease_end_date", format(new Date(), 'yyyy-MM-dd'));

    leases?.forEach(lease => {
      notifs.push({
        id: `lease-${lease.id}`,
        type: 'lease',
        title: 'Lease Renewal Due',
        description: `Lease ending ${format(new Date(lease.lease_end_date), 'MMM dd')}`,
        time: format(new Date(lease.lease_end_date), 'MMM dd'),
        read: false,
        icon: Calendar,
        color: 'text-purple-500'
      });
    });

    // Sort by most recent (using time as proxy)
    setNotifications(notifs.slice(0, 10));
    setUnreadCount(notifs.length);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="shrink-0" />
        
        <div className="flex-1 min-w-0" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative shrink-0 h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={clearAllNotifications}>
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    className={`flex items-start gap-3 p-3 cursor-pointer ${notif.read ? 'opacity-60' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`p-2 rounded-lg bg-muted shrink-0`}>
                      <notif.icon className={`h-4 w-4 ${notif.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground">You're all caught up!</p>
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden md:block max-w-[200px]">
            <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Administrator</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
