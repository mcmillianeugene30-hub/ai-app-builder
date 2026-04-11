import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { Cpu, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Builder", path: "/builder" },
  { label: "My Apps", path: "/my-apps" },
] as const;

export function NavBar() {
  const { isAuthenticated, isLoggingIn, isInitializing, login, logout } =
    useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <header
      className="sticky top-0 z-50 bg-card border-b border-border"
      data-ocid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-ocid="nav-brand"
        >
          <span className="w-7 h-7 bg-accent rounded flex items-center justify-center">
            <Cpu className="w-4 h-4 text-accent-foreground" strokeWidth={2.5} />
          </span>
          <span className="font-display font-black text-lg tracking-tight uppercase text-foreground">
            Synthax
          </span>
        </Link>

        {/* Nav links */}
        <nav
          className="hidden sm:flex items-center gap-1"
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map(({ label, path }) => {
            const isActive = currentPath === path;
            return (
              <Link
                key={path}
                to={path}
                data-ocid={`nav-link-${label.toLowerCase().replace(" ", "-")}`}
                className={[
                  "px-3 py-1.5 text-sm font-body font-medium rounded transition-colors duration-150",
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth controls */}
        <div className="flex items-center gap-2">
          {isInitializing ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              data-ocid="nav-logout-btn"
              className="font-mono text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="nav-login-btn"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              {isLoggingIn ? "Connecting…" : "Login"}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map(({ label, path }) => {
          const isActive = currentPath === path;
          return (
            <Link
              key={path}
              to={path}
              data-ocid={`nav-mobile-${label.toLowerCase().replace(" ", "-")}`}
              className={[
                "px-3 py-1 text-xs font-body font-medium rounded whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
