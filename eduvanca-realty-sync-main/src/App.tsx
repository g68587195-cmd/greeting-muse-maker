import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Clients from "./pages/Clients";
import Leads from "./pages/Leads";
import Sales from "./pages/Sales";
import Finance from "./pages/Finance";
import Maintenance from "./pages/Maintenance";
import Profile from "./pages/Profile";
import TenantManagement from "./pages/TenantManagement";
import SiteProgress from "./pages/SiteProgress";
import Quotations from "./pages/Quotations";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/properties" element={<AppLayout><Properties /></AppLayout>} />
          <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
          <Route path="/leads" element={<AppLayout><Leads /></AppLayout>} />
          <Route path="/sales" element={<AppLayout><Sales /></AppLayout>} />
          <Route path="/quotations" element={<AppLayout><Quotations /></AppLayout>} />
          <Route path="/finance" element={<AppLayout><Finance /></AppLayout>} />
          <Route path="/maintenance" element={<AppLayout><Maintenance /></AppLayout>} />
          <Route path="/tenants" element={<AppLayout><TenantManagement /></AppLayout>} />
          <Route path="/site-progress" element={<AppLayout><SiteProgress /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
