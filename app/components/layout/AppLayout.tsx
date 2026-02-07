import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: React.ReactNode;
  sourceCount?: number;
};

export function AppLayout({ children, sourceCount }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar sourceCount={sourceCount} />
      </div>

      {/* Mobile Header with Hamburger */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar sourceCount={sourceCount} onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="ml-3 font-semibold">SignalDesk</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
