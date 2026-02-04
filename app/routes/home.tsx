import { Link } from "react-router";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SignalDesk" },
    { name: "description", content: "News aggregator for Slack sharing" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border p-4">
        <h1 className="text-xl font-bold text-foreground">SignalDesk</h1>
        <Button variant="ghost" asChild>
          <Link to="/logout">Sign out</Link>
        </Button>
      </header>
      <Welcome />
    </div>
  );
}
