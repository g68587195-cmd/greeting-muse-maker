import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Building2, Users, BarChart3 } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

export default function MarketInsights() {
  const { data: properties = [] } = useQuery({
    queryKey: ["properties_analytics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales_analytics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("sales_transactions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads_analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate analytics
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const soldProperties = properties.filter(p => p.status === 'sold').length;
  const avgPrice = properties.length > 0
    ? properties.reduce((sum, p) => sum + Number(p.price || 0), 0) / properties.length
    : 0;

  const totalRevenue = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.company_revenue || 0), 0);

  const conversionRate = leads.length > 0
    ? ((sales.filter(s => s.status === 'completed').length / leads.length) * 100).toFixed(1)
    : 0;

  // Property type distribution
  const propertyTypes = properties.reduce((acc: any, prop) => {
    acc[prop.property_type] = (acc[prop.property_type] || 0) + 1;
    return acc;
  }, {});

  // Recent trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLeads = leads.filter(
    l => new Date(l.created_at) > thirtyDaysAgo
  ).length;

  const recentSales = sales.filter(
    s => s.contract_date && new Date(s.contract_date) > thirtyDaysAgo
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Market Insights</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Analytics and trends for your real estate business
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totalProperties}</span>
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{availableProperties}</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">₹{formatIndianNumber(totalRevenue)}</span>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{conversionRate}%</span>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">New Leads</span>
              </div>
              <span className="text-xl font-bold">{recentLeads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">Closed Deals</span>
              </div>
              <span className="text-xl font-bold">{recentSales}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(propertyTypes).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium capitalize">{type.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{count}</span>
                  <span className="text-sm text-muted-foreground">
                    ({((count / totalProperties) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Average Price</p>
              <p className="text-xl font-bold mt-1">₹{formatIndianNumber(avgPrice)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Properties Sold</p>
              <p className="text-xl font-bold mt-1">{soldProperties}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Active Leads</p>
              <p className="text-xl font-bold mt-1">
                {leads.filter(l => l.status === 'new' || l.status === 'contacted').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
