import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: React.ReactNode;
  sourceCount?: number;
};

export function AppLayout({ children, sourceCount }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar sourceCount={sourceCount} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
