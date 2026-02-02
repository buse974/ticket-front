import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

// Placeholder icons, similar to the screenshot
const IconLayoutDashboard = ({ className }: { className: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const IconList = ({ className }: { className: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

const navItems = [
  {
    name: "Vue d'ensemble",
    path: "/dashboard",
    icon: IconLayoutDashboard,
  },
  { name: "Files d'attente", path: "/dashboard", icon: IconList },
];

export default function ProLayout({ children }: { children: ReactNode }) {
  const { professional, logout, isAuthenticated, isInitialized } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#09090B]">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090B] text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 font-bold text-lg">
          Byewait
        </div>
        <div className="px-4 py-2">
          <div className="px-4 py-2 rounded-lg bg-gray-900">
            <span className="text-sm text-gray-400">Bienvenue</span>
            <p className="font-semibold">{professional?.name}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold"
                  : "hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 border-b border-gray-800 flex items-center justify-end px-6">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="hover:bg-gray-800 hover:text-white"
          >
            Déconnexion
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
