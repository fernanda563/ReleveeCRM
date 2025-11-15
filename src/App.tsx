import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import STLViewerFullscreen from "./pages/STLViewerFullscreen";
import CalendarAdmin from "./pages/CalendarAdmin";
import SystemSettings from "./pages/SystemSettings";
import RolesManagement from "./pages/RolesManagement";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";

const App = () => (
  <BrowserRouter>
    <Sonner />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/stl-viewer-fullscreen" element={<STLViewerFullscreen />} />
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
        <Route path="/calendar-admin" element={<CalendarAdmin />} />
        <Route path="/settings/calendar" element={<CalendarAdmin />} />
        <Route path="/settings/system" element={<SystemSettings />} />
        <Route path="/settings/roles" element={<RolesManagement />} />
      </Route>
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
