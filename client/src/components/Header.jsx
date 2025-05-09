import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";
import NotificationSidebar from "./NotificationSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Moon, Sun, Monitor, User, Plus } from "lucide-react";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const { theme, setTheme } = useContext(ThemeContext);
  const [showSidebar, setShowSidebar] = useState(false);

  const nextTheme = () => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  const handleToggle = () => {
    const newTheme = nextTheme();
    setTheme(newTheme);
  };

  const icon =
    theme === "dark" ? (
      <Moon size={16} />
    ) : theme === "light" ? (
      <Sun size={16} />
    ) : (
      <Monitor size={16} />
    );
  const label =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold text-xl tracking-tight hover:opacity-90"
          >
            <img src="/logo.svg" alt="App Logo" className="h-8 w-8" />
            Social Feed
          </Link>

          <div className="flex items-center gap-3 lg:gap-4">
            {/* Create Post Shortcut for Mobile */}
            <Link
              to="/create"
              className="lg:hidden p-2 rounded-full border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
              title="Create Post"
            >
              <Plus size={20} />
            </Link>

            {/* Notification Bell */}
            <NotificationBell onClick={() => setShowSidebar((prev) => !prev)} />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-300 transition-all">
                  <Avatar className="w-10 h-10 border-2 border-indigo-500 dark:border-indigo-400 shadow-md hover:scale-105 transition-transform">
                    <AvatarImage src={user?.profilePicture} alt={user?.name} />
                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-700 text-indigo-600 dark:text-white">
                      {user?.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 p-2 rounded-2xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <User size={16} /> View Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleToggle}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                  {icon} Theme: {label}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 border-t dark:border-gray-600" />

                <DropdownMenuItem asChild>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 🔔 Sidebar Notification Panel */}
      {showSidebar && (
        <NotificationSidebar onClose={() => setShowSidebar(false)} />
      )}
    </header>
  );
}
