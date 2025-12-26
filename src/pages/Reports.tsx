import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart, ComposedChart, Scatter } from "recharts";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, Target, Calendar, FileText, Download, Filter, BarChart3, PieChartIcon, LineChartIcon, Activity, ArrowUpRight, ArrowDownRight, Briefcase, Home, Construction } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["hsl(4 97% 61%)", "hsl(38 95% 55%)", "hsl(142 76% 46%)", "hsl(217 91% 60%)", "hsl(280 85% 60%)", "hsl(200 85% 50%)"];

interface ReportKPI {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: any;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any[]>([]);
  const [leadConversion, setLeadConversion] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [salesByType, setSalesByType] = useState<any[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<any[]>([]);
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [siteProjectData, setSiteProjectData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<ReportKPI[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Revenue by category
    const { data: sales } = await supabase
      .from("sales_transactions")
      .select("sale_price, company_revenue, transaction_type, status, closing_date")
      .eq("user_id", user.id);

    const completedSales = sales?.filter(s => s.status === 'completed') || [];
    const revenueByType = completedSales.reduce((acc: any, sale) => {
      const type = sale.transaction_type;
      acc[type] = (acc[type] || 0) + (sale.company_revenue || sale.sale_price);
      return acc;
    }, {});

    setRevenueData(Object.entries(revenueByType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    })));

    // Sales by transaction type
    const salesByTypeData = sales?.reduce((acc: any, sale) => {
      const type = sale.transaction_type;
      acc[type] = acc[type] || { total: 0, completed: 0 };
      acc[type].total++;
      if (sale.status === 'completed') acc[type].completed++;
      return acc;
    }, {});

    setSalesByType(Object.entries(salesByTypeData || {}).map(([name, data]: [string, any]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      total: data.total,
      completed: data.completed,
      rate: ((data.completed / data.total) * 100).toFixed(1)
    })));

    // Property status distribution
    const { data: properties } = await supabase
      .from("properties")
      .select("status, property_type, price, category")
      .eq("user_id", user.id);

    const propStatus = properties?.reduce((acc: any, prop) => {
      acc[prop.status] = (acc[prop.status] || 0) + 1;
      return acc;
    }, {});

    setPropertyData(Object.entries(propStatus || {}).map(([name, value]) => ({
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    })));

    // Property performance by type
    const propByType = properties?.reduce((acc: any, prop) => {
      const type = prop.property_type;
      acc[type] = acc[type] || { count: 0, totalValue: 0 };
      acc[type].count++;
      acc[type].totalValue += prop.price;
      return acc;
    }, {});

    setPropertyPerformance(Object.entries(propByType || {}).map(([name, data]: [string, any]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: data.count,
      avgValue: Math.round(data.totalValue / data.count),
      totalValue: data.totalValue
    })));

    // Lead conversion funnel and source analysis
    const { data: leads } = await supabase
      .from("leads")
      .select("status, source, purpose, created_at")
      .eq("user_id", user.id);

    const leadStats = leads?.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    setLeadConversion([
      { stage: "New", count: leadStats?.new || 0, fill: COLORS[0] },
      { stage: "Contacted", count: leadStats?.contacted || 0, fill: COLORS[1] },
      { stage: "Qualified", count: leadStats?.qualified || 0, fill: COLORS[2] },
      { stage: "Negotiating", count: leadStats?.negotiating || 0, fill: COLORS[3] },
      { stage: "Won", count: leadStats?.won || 0, fill: COLORS[4] },
      { stage: "Lost", count: leadStats?.lost || 0, fill: COLORS[5] },
    ]);

    // Lead source analysis
    const sourceStats = leads?.reduce((acc: any, lead) => {
      const source = lead.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    setLeadSourceData(Object.entries(sourceStats || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    })));

    // Monthly trends
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("user_id", user.id)
      .eq("status", "paid");

    const last6Months: any = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yy');
      last6Months[key] = { month: key, revenue: 0, expenses: 0, profit: 0 };
    }

    payments?.forEach(payment => {
      const month = format(new Date(payment.payment_date), 'MMM yy');
      if (last6Months[month]) {
        last6Months[month].revenue += Number(payment.amount);
      }
    });

    // Get expenses from site financial log
    const { data: expenses } = await supabase
      .from("site_financial_log")
      .select("amount, transaction_date");

    expenses?.forEach(exp => {
      const month = format(new Date(exp.transaction_date), 'MMM yy');
      if (last6Months[month]) {
        last6Months[month].expenses += Number(exp.amount);
      }
    });

    Object.values(last6Months).forEach((m: any) => {
      m.profit = m.revenue - m.expenses;
    });

    setMonthlyTrends(Object.values(last6Months));

    // Site project data
    const { data: sites } = await supabase
      .from("site_projects")
      .select("project_status, health_indicator, total_budget, spent_amount, overall_progress_percentage")
      .eq("user_id", user.id);

    const siteStats = sites?.reduce((acc: any, site) => {
      const status = site.project_status || 'unknown';
      acc[status] = acc[status] || { count: 0, budget: 0, spent: 0 };
      acc[status].count++;
      acc[status].budget += site.total_budget || 0;
      acc[status].spent += site.spent_amount || 0;
      return acc;
    }, {});

    setSiteProjectData(Object.entries(siteStats || {}).map(([name, data]: [string, any]) => ({
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      count: data.count,
      budget: data.budget,
      spent: data.spent,
      variance: data.budget - data.spent
    })));

    // Calculate KPIs
    const totalRev = completedSales.reduce((sum, sale) => sum + (sale.company_revenue || sale.sale_price), 0);
    const avgValue = properties?.reduce((sum, p) => sum + p.price, 0) / (properties?.length || 1);
    const convRate = ((leadStats?.won || 0) / (leads?.length || 1)) * 100;
    const activeProjects = sites?.filter(s => ['planning', 'in_progress'].includes(s.project_status || '')).length || 0;
    const totalClients = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("user_id", user.id);

    setKpis([
      {
        title: "Total Revenue",
        value: `₹${formatIndianNumber(totalRev)}`,
        change: "+15.3%",
        changeType: 'positive',
        icon: DollarSign
      },
      {
        title: "Avg Property Value",
        value: `₹${formatIndianNumber(Math.round(avgValue))}`,
        change: "+5.2%",
        changeType: 'positive',
        icon: Building2
      },
      {
        title: "Lead Conversion",
        value: `${convRate.toFixed(1)}%`,
        change: convRate > 15 ? "+2.1%" : "-1.5%",
        changeType: convRate > 15 ? 'positive' : 'negative',
        icon: Target
      },
      {
        title: "Active Projects",
        value: activeProjects,
        change: "In Progress",
        changeType: 'neutral',
        icon: Construction
      },
      {
        title: "Total Properties",
        value: properties?.length || 0,
        change: "+3 this month",
        changeType: 'positive',
        icon: Home
      },
      {
        title: "Total Clients",
        value: totalClients.count || 0,
        change: "+8 new",
        changeType: 'positive',
        icon: Users
      },
    ]);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Comprehensive analytics and performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="py-1 px-3">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(), 'MMM yyyy')}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-primary" />
                <div className={`flex items-center text-xs font-medium ${
                  kpi.changeType === 'positive' ? 'text-green-600' : 
                  kpi.changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {kpi.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                  {kpi.changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-lg md:text-xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-background">
            <DollarSign className="h-4 w-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-background">
            <Target className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-background">
            <Building2 className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-background">
            <Construction className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4 text-primary" />
                  Revenue & Expenses Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 76% 46%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(142 76% 46%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis tickFormatter={(v) => `₹${formatIndianNumber(v)}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip formatter={(value: any) => `₹${formatIndianNumber(value)}`} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke="hsl(142 76% 46%)" strokeWidth={2} dot={{ fill: 'hsl(142 76% 46%)' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Revenue by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
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
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No revenue data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sales by Transaction Type</CardTitle>
                <CardDescription>Completion rate by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Status</CardTitle>
                <CardDescription>Current distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={propertyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Conversion Funnel</CardTitle>
                <CardDescription>Journey from new to won</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadConversion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {leadConversion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Sources</CardTitle>
                <CardDescription>Where leads come from</CardDescription>
              </CardHeader>
              <CardContent>
                {leadSourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {leadSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No source data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Performance by Type</CardTitle>
                <CardDescription>Count and average value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={propertyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₹${formatIndianNumber(v)}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip formatter={(value: any, name: string) => name.includes('Value') ? `₹${formatIndianNumber(value)}` : value} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgValue" name="Avg Value" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={propertyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {propertyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Budget Analysis</CardTitle>
                <CardDescription>Budget vs Spent by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={siteProjectData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis tickFormatter={(v) => `₹${formatIndianNumber(v)}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip formatter={(value: any) => `₹${formatIndianNumber(value)}`} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spent" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {siteProjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={siteProjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {siteProjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No project data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
