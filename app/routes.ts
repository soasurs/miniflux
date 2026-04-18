import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("bookmarks", "routes/bookmarks.tsx"),
  route("entry/:entryId", "routes/entry.tsx"),
  route("history", "routes/history.tsx"),
  route("login", "routes/login.tsx")
] satisfies RouteConfig;
