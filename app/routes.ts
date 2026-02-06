import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  // Public routes
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  // API routes (protected via code)
  route("api/sources", "routes/api/sources.ts"),
  route("api/cron/fetch-rss", "routes/api/cron/fetch-rss.ts"),

  // Protected routes
  layout("routes/_protected.tsx", [
    index("routes/home.tsx"),
    route("favorites", "routes/favorites.tsx"),
    route("excluded", "routes/excluded.tsx"),
    route("sources", "routes/sources.tsx"),
    route("tags", "routes/tags.tsx"),
  ]),
] satisfies RouteConfig;
