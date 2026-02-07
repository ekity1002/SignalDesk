import { EyeOff, LayoutGrid, LogOut, Rss, Settings, Star, Tags } from "lucide-react";
import { Link, useLocation } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarProps = {
  sourceCount?: number;
};

export function Sidebar({ sourceCount = 0 }: SidebarProps) {
  const location = useLocation();

  const navigation: NavSection[] = [
    {
      title: "FEEDS",
      items: [
        { label: "Latest News", href: "/", icon: LayoutGrid },
        { label: "Favorites", href: "/favorites", icon: Star },
        { label: "Excluded", href: "/excluded", icon: EyeOff },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        {
          label: "RSS Sources",
          href: "/sources",
          icon: Rss,
          badge: `${sourceCount}/10`,
        },
        { label: "Interest Tags", href: "/tags", icon: Tags },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-accent">
            <LayoutGrid className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">SignalDesk</h1>
            <p className="text-xs text-sidebar-muted">Slack Sharing Support</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {navigation.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-2 text-xs font-medium tracking-wider text-sidebar-muted">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent/20 text-sidebar-accent"
                          : "text-sidebar-foreground hover:bg-sidebar-border",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs",
                            isActive
                              ? "bg-sidebar-accent/30 text-sidebar-accent"
                              : "bg-sidebar-border text-sidebar-muted",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-white">
              U
            </div>
            <div>
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-sidebar-muted">Admin</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Settings"
                className="rounded p-2 text-sidebar-muted hover:bg-sidebar-border hover:text-sidebar-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/logout" className="text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
