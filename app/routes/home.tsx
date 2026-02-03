import { Link } from "react-router";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SignalDesk" },
    { name: "description", content: "News aggregator for Slack sharing" },
  ];
}

export default function Home() {
  return (
    <div>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          SignalDesk
        </h1>
        <Link
          to="/logout"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Sign out
        </Link>
      </header>
      <Welcome />
    </div>
  );
}
