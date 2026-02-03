import { Outlet } from "react-router";
import type { unstable_MiddlewareFunction as MiddlewareFunction } from "react-router";
import { requireAuth } from "~/lib/auth/middleware.server";

export const unstable_middleware: MiddlewareFunction[] = [requireAuth];

export default function ProtectedLayout() {
  return <Outlet />;
}
