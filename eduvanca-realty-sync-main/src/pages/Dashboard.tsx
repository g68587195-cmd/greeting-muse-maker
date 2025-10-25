import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, DollarSign, TrendingUp, Home, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalProperties: number;
  availableProperties: number;
  totalClients: number;
  activeLeads: number;
  totalRevenue: number;
  pendingMaintenance: number;
}

const COLORS = ["hsl(195 85% 35%)", "hsl(38 95% 55%)", "hsl(142 76% 36%)", "hsl(0 84% 60%)"];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    availableProperties: 0,
    totalClients: 0,
    activeLeads: 0,
    totalRevenue: 0,
    pendingMaintenance: 0,
  });

  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch properties count
    const { count: totalProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    const { count: availableProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "available");

    // Fetch clients count
    const { count: totalClients } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    // Fetch active leads
    const { count: activeLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "contacted", "qualified"]);

    // Fetch total revenue
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid");

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Fetch pending maintenance
    const { count: pendingMaintenance } = await supabase
      .from("maintenance_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Fetch property types distribution
    const { data: properties } = await supabase
      .from("properties")
      .select("property_type");

    const typesCount = properties?.reduce((acc: any, prop) => {
      acc[prop.property_type] = (acc[prop.property_type] || 0) + 1;
      return acc;
    }, {});

    const typesData = Object.entries(typesCount || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    setPropertyTypes(typesData);
    setStats({
      totalProperties: totalProperties || 0,
      availableProperties: availableProperties || 0,
      totalClients: totalClients || 0,
      activeLeads: activeLeads || 0,
      totalRevenue,
      pendingMaintenance: pendingMaintenance || 0,
    });
  };

  const statCards = [
    {
      title: "Total Properties",
      value: stats.totalProperties,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Available Properties",
      value: stats.availableProperties,
      icon: Home,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Active Leads",
      value: stats.activeLeads,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Maintenance",
      value: stats.pendingMaintenance,
      icon: Wrench,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Eduvanca Realestates Management System</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {propertyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: "Properties", value: stats.totalProperties },
                { name: "Clients", value: stats.totalClients },
                { name: "Leads", value: stats.activeLeads },
                { name: "Maintenance", value: stats.pendingMaintenance },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(195 85% 35%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
