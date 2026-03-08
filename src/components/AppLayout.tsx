import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, List, PlusCircle, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/jobs", icon: List, label: "My Jobs" },
  { to: "/add-job", icon: PlusCircle, label: "Add Job" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-5 pb-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-lg">🇫🇷</span>
            <span className="text-[15px] font-semibold text-sidebar-foreground tracking-tight">
              JobHunt
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon className="w-[15px] h-[15px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-[11px] font-medium text-sidebar-foreground/80">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] text-muted-foreground truncate flex-1">{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors w-full"
          >
            <LogOut className="w-[15px] h-[15px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <nav className="flex">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="pb-20 md:pb-0 p-6 md:p-10 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
