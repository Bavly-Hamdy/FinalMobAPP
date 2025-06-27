
import React from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Activity, Brain, MessageSquare, Bell, Settings } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { t } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { name: t("home"), icon: <Home size={24} />, path: "/" },
    { name: t("readings"), icon: <Activity size={24} />, path: "/readings" },
    { name: t("predictions"), icon: <Brain size={24} />, path: "/predictions" },
    { name: t("chatbot"), icon: <MessageSquare size={24} />, path: "/chatbot" },
    { name: t("reminders"), icon: <Bell size={24} />, path: "/reminders" },
    { name: t("settings"), icon: <Settings size={24} />, path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border dark:border-gray-800 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center h-full w-full transition-colors ${
                isActive(item.path)
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className={`${isActive(item.path) ? "animate-pulse-gentle" : ""}`}>
                {item.icon}
              </div>
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
