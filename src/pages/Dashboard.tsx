import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, DollarSign, TrendingUp, Home, Wrench, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface Stats {
  totalProperties: number;
  availableProperties: number;
  totalClients: number;
  activeLeads: number;
  totalRevenue: number;
  pendingMaintenance: number;
  totalQuotations: number;
  activeSites: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 46%)", "hsl(217 91% 60%)", "hsl(280 85% 60%)"];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    availableProperties: 0,
    totalClients: 0,
    activeLeads: 0,
    totalRevenue: 0,
    pendingMaintenance: 0,
    totalQuotations: 0,
    activeSites: 0,
  });

  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [leadStatus, setLeadStatus] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch properties count
    const { count: totalProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: availableProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .eq("user_id", user.id);

    // Fetch clients count
    const { count: totalClients } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Fetch active leads
    const { count: activeLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "contacted", "qualified"])
      .eq("user_id", user.id);

    // Fetch all leads for status breakdown
    const { data: allLeads } = await supabase
      .from("leads")
      .select("status")
      .eq("user_id", user.id);

    const leadStatusCount = allLeads?.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const leadStatusData = Object.entries(leadStatusCount || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    setLeadStatus(leadStatusData);

    // Fetch total revenue from payments, sales, and tenant payments
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "paid")
      .eq("user_id", user.id);

    const { data: salesRevenue } = await supabase
      .from("sales_transactions")
      .select("sale_price, company_revenue, closing_date")
      .eq("status", "completed")
      .eq("user_id", user.id);

    const { data: tenantPayments } = await supabase
      .from("tenant_payment_logs")
      .select("amount, payment_date, tenant_management_id")
      .eq("tenant_management_id", user.id);

    const paymentsTotal = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const salesTotal = salesRevenue?.reduce((sum, s) => sum + Number(s.company_revenue || s.sale_price || 0), 0) || 0;
    const tenantTotal = tenantPayments?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalRevenue = paymentsTotal + salesTotal + tenantTotal;

    // Calculate monthly revenue for last 6 months
    const monthlyData: any = {};
    payments?.forEach(payment => {
      const month = new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[month] = (monthlyData[month] || 0) + Number(payment.amount);
    });

    const monthlyRevenueData = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount: Number(amount),
    })).slice(-6);

    setMonthlyRevenue(monthlyRevenueData);

    // Fetch pending maintenance
    const { count: pendingMaintenance } = await supabase
      .from("maintenance_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("user_id", user.id);

    // Fetch quotations count
    const { count: totalQuotations } = await supabase
      .from("quotations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Fetch active sites
    const { count: activeSites } = await supabase
      .from("site_progress")
      .select("*", { count: "exact", head: true })
      .in("project_status", ["planning", "in_progress"])
      .eq("user_id", user.id);

    // Fetch property types distribution
    const { data: properties } = await supabase
      .from("properties")
      .select("property_type")
      .eq("user_id", user.id);

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
      totalQuotations: totalQuotations || 0,
      activeSites: activeSites || 0,
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
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Leads",
      value: stats.activeLeads,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Total Revenue",
      value: `₹${formatIndianNumber(stats.totalRevenue)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Maintenance",
      value: stats.pendingMaintenance,
      icon: Wrench,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total Quotations",
      value: stats.totalQuotations,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Active Sites",
      value: stats.activeSites,
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Real Estate Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {propertyTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={propertyTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No property data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {leadStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No lead data available
              </div>
            )}
          </CardContent>
        </Card>

        {monthlyRevenue.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${formatIndianNumber(value)}`} />
                  <Tooltip formatter={(value: any) => `₹${formatIndianNumber(value)}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
                { name: "Sites", value: stats.activeSites },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(142 76% 46%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
