import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, TrendingUp, Home, Wrench, FileText, Calendar, Activity, CheckCircle, AlertCircle, Clock, Target, Briefcase, ArrowUpRight, ArrowDownRight, UserPlus, FileCheck, Construction } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from "recharts";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { format, subDays, isAfter, isBefore, startOfMonth, endOfMonth } from "date-fns";

interface Stats {
  totalProperties: number;
  availableProperties: number;
  totalClients: number;
  activeLeads: number;
  totalRevenue: number;
  companyProfit: number;
  pendingMaintenance: number;
  totalQuotations: number;
  activeSites: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  monthlyTarget: number;
  achievedTarget: number;
  overduePayments: number;
  upcomingRenewals: number;
}

interface RecentActivity {
  id: string;
  type: 'lead' | 'client' | 'property' | 'payment' | 'maintenance' | 'site';
  title: string;
  description: string;
  time: string;
  icon: any;
  color: string;
}

interface PendingTask {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 46%)", "hsl(217 91% 60%)", "hsl(280 85% 60%)"];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    availableProperties: 0,
    totalClients: 0,
    activeLeads: 0,
    totalRevenue: 0,
    companyProfit: 0,
    pendingMaintenance: 0,
    totalQuotations: 0,
    activeSites: 0,
    wonLeads: 0,
    lostLeads: 0,
    conversionRate: 0,
    monthlyTarget: 5000000,
    achievedTarget: 0,
    overduePayments: 0,
    upcomingRenewals: 0,
  });

  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [leadStatus, setLeadStatus] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [siteHealth, setSiteHealth] = useState<any[]>([]);

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

    // Fetch leads data
    const { data: allLeads } = await supabase
      .from("leads")
      .select("status, created_at, lead_name")
      .eq("user_id", user.id);

    const activeLeads = allLeads?.filter(l => ['new', 'contacted', 'qualified', 'negotiating'].includes(l.status)).length || 0;
    const wonLeads = allLeads?.filter(l => l.status === 'won').length || 0;
    const lostLeads = allLeads?.filter(l => l.status === 'lost').length || 0;
    const conversionRate = allLeads?.length ? (wonLeads / allLeads.length) * 100 : 0;

    const leadStatusCount = allLeads?.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const leadStatusData = Object.entries(leadStatusCount || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    setLeadStatus(leadStatusData);

    // Fetch payments and revenue data
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date, status")
      .eq("user_id", user.id);

    const { data: salesRevenue } = await supabase
      .from("sales_transactions")
      .select("sale_price, company_revenue, closing_date, status")
      .eq("user_id", user.id);

    const { data: allTenants } = await supabase
      .from("tenant_management")
      .select("id, next_payment_date, lease_end_date")
      .eq("user_id", user.id);

    const tenantIds = allTenants?.map(t => t.id) || [];
    
    const { data: tenantPayments } = await supabase
      .from("tenant_payment_logs")
      .select("amount, payment_date")
      .in("tenant_management_id", tenantIds.length > 0 ? tenantIds : ['none']);

    const paidPayments = payments?.filter(p => p.status === 'paid') || [];
    const overduePayments = payments?.filter(p => p.status === 'overdue').length || 0;
    const paymentsTotal = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const completedSales = salesRevenue?.filter(s => s.status === 'completed') || [];
    const salesTotal = completedSales.reduce((sum, s) => sum + Number(s.sale_price || 0), 0);
    const salesCompanyRevenue = completedSales.reduce((sum, s) => sum + Number(s.company_revenue || 0), 0);
    const tenantTotal = tenantPayments?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const totalRevenue = paymentsTotal + salesTotal + tenantTotal;
    const companyProfit = salesCompanyRevenue + tenantTotal;

    // Monthly revenue calculation
    const monthlyData: any = {};
    const last6Months = Array.from({length: 6}, (_, i) => {
      const d = subDays(new Date(), i * 30);
      return format(d, 'MMM yy');
    }).reverse();

    last6Months.forEach(m => monthlyData[m] = 0);

    paidPayments.forEach(payment => {
      const month = format(new Date(payment.payment_date), 'MMM yy');
      if (monthlyData[month] !== undefined) {
        monthlyData[month] += Number(payment.amount);
      }
    });

    setMonthlyRevenue(Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount: Number(amount),
    })));

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
    const { data: sites } = await supabase
      .from("site_projects")
      .select("project_status, health_indicator, project_name")
      .eq("user_id", user.id);

    const activeSites = sites?.filter(s => ['planning', 'in_progress'].includes(s.project_status || '')).length || 0;

    // Site health distribution
    const healthCount = sites?.reduce((acc: any, site) => {
      acc[site.health_indicator || 'green'] = (acc[site.health_indicator || 'green'] || 0) + 1;
      return acc;
    }, {});

    setSiteHealth(Object.entries(healthCount || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'green' ? 'hsl(142 76% 46%)' : name === 'yellow' ? 'hsl(38 95% 55%)' : 'hsl(0 84% 60%)'
    })));

    // Fetch property types distribution
    const { data: properties } = await supabase
      .from("properties")
      .select("property_type, created_at, title")
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

    // Calculate monthly achieved target
    const startMonth = startOfMonth(new Date());
    const endMonth = endOfMonth(new Date());
    const thisMonthRevenue = paidPayments
      .filter(p => {
        const date = new Date(p.payment_date);
        return isAfter(date, startMonth) && isBefore(date, endMonth);
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Upcoming lease renewals
    const upcomingRenewals = allTenants?.filter(t => {
      if (!t.lease_end_date) return false;
      const endDate = new Date(t.lease_end_date);
      const thirtyDaysFromNow = subDays(new Date(), -30);
      return isBefore(endDate, thirtyDaysFromNow) && isAfter(endDate, new Date());
    }).length || 0;

    // Build recent activities
    const activities: RecentActivity[] = [];

    // Recent leads
    const recentLeads = allLeads?.slice(0, 3) || [];
    recentLeads.forEach(lead => {
      activities.push({
        id: `lead-${lead.lead_name}`,
        type: 'lead',
        title: 'New Lead Added',
        description: lead.lead_name || 'Unknown',
        time: format(new Date(lead.created_at), 'MMM dd, hh:mm a'),
        icon: UserPlus,
        color: 'text-blue-500'
      });
    });

    // Recent properties
    properties?.slice(0, 2).forEach(prop => {
      activities.push({
        id: `prop-${prop.title}`,
        type: 'property',
        title: 'Property Listed',
        description: prop.title,
        time: format(new Date(prop.created_at), 'MMM dd, hh:mm a'),
        icon: Building2,
        color: 'text-primary'
      });
    });

    setRecentActivities(activities.slice(0, 6));

    // Build pending tasks
    const tasks: PendingTask[] = [];

    // Overdue payments as tasks
    if (overduePayments > 0) {
      tasks.push({
        id: 'overdue-payments',
        title: `${overduePayments} Overdue Payment(s)`,
        type: 'payment',
        dueDate: 'Immediate',
        priority: 'high'
      });
    }

    // Pending maintenance
    if (pendingMaintenance && pendingMaintenance > 0) {
      tasks.push({
        id: 'pending-maintenance',
        title: `${pendingMaintenance} Maintenance Request(s)`,
        type: 'maintenance',
        dueDate: 'Review needed',
        priority: 'medium'
      });
    }

    // Follow-up leads
    const { data: followUpLeads } = await supabase
      .from("leads")
      .select("id, lead_name, follow_up_date")
      .eq("user_id", user.id)
      .not("follow_up_date", "is", null)
      .lte("follow_up_date", format(new Date(), 'yyyy-MM-dd'));

    followUpLeads?.slice(0, 3).forEach(lead => {
      tasks.push({
        id: `follow-${lead.id}`,
        title: `Follow up: ${lead.lead_name}`,
        type: 'lead',
        dueDate: lead.follow_up_date || 'Today',
        priority: 'high'
      });
    });

    setPendingTasks(tasks.slice(0, 5));

    setStats({
      totalProperties: totalProperties || 0,
      availableProperties: availableProperties || 0,
      totalClients: totalClients || 0,
      activeLeads,
      totalRevenue,
      companyProfit,
      pendingMaintenance: pendingMaintenance || 0,
      totalQuotations: totalQuotations || 0,
      activeSites,
      wonLeads,
      lostLeads,
      conversionRate,
      monthlyTarget: 5000000,
      achievedTarget: thisMonthRevenue,
      overduePayments,
      upcomingRenewals,
    });
  };

  const primaryKPIs = [
    {
      title: "Total Revenue",
      value: `₹${formatIndianNumber(stats.totalRevenue)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Company Profit",
      value: `₹${formatIndianNumber(stats.companyProfit)}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Active Leads",
      value: stats.activeLeads,
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      trend: `${stats.conversionRate.toFixed(1)}% conv.`,
      trendUp: stats.conversionRate > 10,
    },
    {
      title: "Active Sites",
      value: stats.activeSites,
      icon: Construction,
      color: "text-indigo-600",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      trend: "In progress",
      trendUp: true,
    },
  ];

  const secondaryKPIs = [
    { title: "Total Properties", value: stats.totalProperties, icon: Building2, color: "text-primary" },
    { title: "Available", value: stats.availableProperties, icon: Home, color: "text-green-600" },
    { title: "Total Clients", value: stats.totalClients, icon: Users, color: "text-blue-600" },
    { title: "Quotations", value: stats.totalQuotations, icon: FileText, color: "text-purple-600" },
    { title: "Maintenance", value: stats.pendingMaintenance, icon: Wrench, color: "text-red-600" },
    { title: "Renewals Due", value: stats.upcomingRenewals, icon: Calendar, color: "text-amber-600" },
  ];

  const targetPercentage = Math.min((stats.achievedTarget / stats.monthlyTarget) * 100, 100);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Real Estate Management Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs md:text-sm py-1 px-3">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <span className="text-xs md:text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {primaryKPIs.map((kpi) => (
          <Card key={kpi.title} className={`${kpi.bgColor} border-0 shadow-sm hover:shadow-md transition-all`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <kpi.icon className={`h-8 w-8 md:h-10 md:w-10 ${kpi.color} opacity-80`} />
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.trend}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">{kpi.title}</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-3 grid-cols-3 lg:grid-cols-6">
        {secondaryKPIs.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-sm transition-all">
            <CardContent className="p-3 md:p-4 text-center">
              <kpi.icon className={`h-5 w-5 mx-auto ${kpi.color}`} />
              <p className="text-lg md:text-xl font-bold mt-2">{kpi.value}</p>
              <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Target Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Monthly Target Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Achieved: ₹{formatIndianNumber(stats.achievedTarget)}</span>
            <span className="text-sm font-medium">Target: ₹{formatIndianNumber(stats.monthlyTarget)}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-500"
              style={{ width: `${targetPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">{targetPercentage.toFixed(1)}% achieved</p>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg bg-muted`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length > 0 ? pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg ${
                  task.priority === 'high' ? 'bg-red-100' : 
                  task.priority === 'medium' ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  {task.priority === 'high' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
                   task.priority === 'medium' ? <Clock className="h-4 w-4 text-amber-600" /> :
                   <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                </div>
                <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                  {task.priority}
                </Badge>
              </div>
            )) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Site Health Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Site Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {siteHealth.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={siteHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {siteHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                No site data
              </div>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {siteHealth.map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {propertyTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={propertyTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={90}
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
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No property data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {leadStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={leadStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {leadStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No lead data
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis tickFormatter={(value) => `₹${formatIndianNumber(value)}`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip formatter={(value: any) => `₹${formatIndianNumber(value)}`} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
