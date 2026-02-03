import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/_protected";
import { getSession } from "~/lib/auth/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const isAuthenticated = session.get("isAuthenticated");

  if (!isAuthenticated) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return null;
}

export default function ProtectedLayout() {
  return <Outlet />;
}
