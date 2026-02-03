import { redirect } from "react-router";
import type { unstable_MiddlewareFunction as MiddlewareFunction } from "react-router";
import { getSession } from "./session.server";
import { authContext } from "./context";

export const requireAuth: MiddlewareFunction = async ({ request, context }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const isAuthenticated = session.get("isAuthenticated");

  if (!isAuthenticated) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  context.set(authContext, {
    isAuthenticated: true,
    authenticatedAt: session.get("authenticatedAt") ?? null,
  });
};
