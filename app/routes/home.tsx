import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SignalDesk" },
    { name: "description", content: "News aggregator for Slack sharing" },
  ];
}

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Latest News</h1>
      <p className="mt-2 text-muted-foreground">News articles will be displayed here.</p>
    </div>
  );
}
