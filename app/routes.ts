import { index, route, layout, type RouteConfig } from "@react-router/dev/routes";

export default [
  // Public routes
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  // Protected routes
  layout("routes/_protected.tsx", [
    index("routes/home.tsx"),
  ]),
] satisfies RouteConfig;
