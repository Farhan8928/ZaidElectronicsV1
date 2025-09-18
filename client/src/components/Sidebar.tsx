import { Link, useLocation } from "wouter";
import { Settings, Moon, Sun, BarChart3, FileText, Download, Plus, List } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/add-job", icon: Plus, label: "Add New Job" },
    { path: "/jobs", icon: List, label: "Job List" },
    { path: "/reports", icon: FileText, label: "Reports" },
    { path: "/export", icon: Download, label: "Export Data" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Settings className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Zaid Electronics</h1>
            <p className="text-xs text-muted-foreground">Job Management</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link 
                  href={item.path} 
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Settings Section */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={toggleTheme}
          className="nav-link w-full"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}
