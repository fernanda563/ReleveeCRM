import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CRM from "./pages/CRM";
import ClientDetail from "./pages/ClientDetail";
import Orders from "./pages/Orders";
import Production from "./pages/Production";
import ProductionDashboard from "./pages/ProductionDashboard";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import STLCollection from "./pages/STLCollection";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/:clientId" element={<ClientDetail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/production" element={<Production />} />
          <Route path="/production/dashboard" element={<ProductionDashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/stl-collection" element={<STLCollection />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
