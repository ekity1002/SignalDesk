import { Outlet, redirect, useLoaderData } from "react-router";
import { AppLayout } from "~/components/layout";
import { getSession } from "~/lib/auth/session.server";
import { getSourceCount } from "~/lib/rss/sources.server";
import type { Route } from "./+types/_protected";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const isAuthenticated = session.get("isAuthenticated");

  if (!isAuthenticated) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const sourceCount = await getSourceCount();

  return { sourceCount };
}

export default function ProtectedLayout() {
  const { sourceCount } = useLoaderData<typeof loader>();

  return (
    <AppLayout sourceCount={sourceCount}>
      <Outlet />
    </AppLayout>
  );
}
