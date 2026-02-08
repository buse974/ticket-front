import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/authStore";

// Layout
import ProLayout from "@/pages/pro/ProLayout";

// Pages
import QueuePage from "@/pages/client/QueuePage";

import LoginPage from "@/pages/pro/LoginPage";
import RegisterPage from "@/pages/pro/RegisterPage";
import DashboardPage from "@/pages/pro/DashboardPage";
import QueuesListPage from "@/pages/pro/QueuesListPage";
import QueueDashboardPage from "@/pages/pro/QueueDashboardPage";
import QRCodePage from "@/pages/pro/QRCodePage";
import DisplayPage from "@/pages/pro/DisplayPage";
import SettingsPage from "@/pages/pro/SettingsPage";
import ForgotPasswordPage from "@/pages/pro/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/pro/ResetPasswordPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Wrapper for protected routes with layout
const ProtectedRoutes = () => (
  <ProLayout>
    <Outlet />
  </ProLayout>
);

// Redirect to dashboard if logged in, otherwise to login
function HomeRedirect() {
  const { professional } = useAuthStore();
  return <Navigate to={professional ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect home to login/dashboard */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Public - Client queue access */}
        <Route path="/queue/:id" element={<QueuePage />} />
        <Route path="/q/:slug" element={<QueuePage />} />
        {/* Redirect old ticket URLs to queue page */}
        <Route path="/q/:slug/ticket/:ticketId" element={<QueuePage />} />
        <Route path="/queue/:id/ticket/:ticketId" element={<QueuePage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Pro (protected) */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/queues" element={<QueuesListPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/:queueId" element={<QueueDashboardPage />} />
        </Route>

        {/* Standalone Pro pages */}
        <Route path="/qrcode/:queueId" element={<QRCodePage />} />
        <Route path="/display/:queueId" element={<DisplayPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}
