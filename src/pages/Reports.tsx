import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from "recharts";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, Target } from "lucide-react";

const COLORS = ["hsl(4 97% 61%)", "hsl(38 95% 55%)", "hsl(142 76% 46%)", "hsl(217 91% 60%)", "hsl(280 85% 60%)"];

export default function Reports() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any[]>([]);
  const [leadConversion, setLeadConversion] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    avgPropertyValue: 0,
    conversionRate: 0,
    activeProjects: 0,
  });

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Revenue by category
    const { data: sales } = await supabase
      .from("sales_transactions")
      .select("sale_price, company_revenue, transaction_type")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const revenueByType = sales?.reduce((acc: any, sale) => {
      const type = sale.transaction_type;
      acc[type] = (acc[type] || 0) + (sale.company_revenue || sale.sale_price);
      return acc;
    }, {});

    setRevenueData(Object.entries(revenueByType || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    })));

    // Property status distribution
    const { data: properties } = await supabase
      .from("properties")
      .select("status")
      .eq("user_id", user.id);

    const propStatus = properties?.reduce((acc: any, prop) => {
      acc[prop.status] = (acc[prop.status] || 0) + 1;
      return acc;
    }, {});

    setPropertyData(Object.entries(propStatus || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    })));

    // Lead conversion funnel
    const { data: leads } = await supabase
      .from("leads")
      .select("status")
      .eq("user_id", user.id);

    const leadStats = leads?.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    setLeadConversion([
      { stage: "New", count: leadStats?.new || 0 },
      { stage: "Contacted", count: leadStats?.contacted || 0 },
      { stage: "Qualified", count: leadStats?.qualified || 0 },
      { stage: "Won", count: leadStats?.won || 0 },
    ]);

    // Monthly trends (last 6 months)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .gte("payment_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

    const monthlyData: any = {};
    payments?.forEach(payment => {
      const month = new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[month] = (monthlyData[month] || 0) + payment.amount;
    });

    setMonthlyTrends(Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    })));

    // KPIs
    const totalRev = sales?.reduce((sum, sale) => sum + (sale.company_revenue || sale.sale_price), 0) || 0;
    const { data: allProps } = await supabase
      .from("properties")
      .select("price")
      .eq("user_id", user.id);
    
    const avgValue = allProps?.reduce((sum, p) => sum + p.price, 0) / (allProps?.length || 1);
    const convRate = ((leadStats?.won || 0) / (leads?.length || 1)) * 100;
    
    const { count: activeProjects } = await supabase
      .from("site_projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("project_status", ["planning", "in_progress"]);

    setKpis({
      totalRevenue: totalRev,
      avgPropertyValue: avgValue,
      conversionRate: convRate,
      activeProjects: activeProjects || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Reports</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive analytics and performance insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatIndianNumber(kpis.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">12.5% from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Property Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatIndianNumber(kpis.avgPropertyValue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">5.2% increase</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span className="text-destructive">2.1% from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Transaction Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₹${formatIndianNumber(value)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadConversion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="stage" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }} 
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => `₹${formatIndianNumber(value)}`}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
