import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/home/home.tsx"),
  route("bookmarks", "pages/bookmarks/bookmarks.tsx"),
  route("entry/:entryId", "pages/entry/entry.tsx"),
  route("history", "pages/history/history.tsx"),
  route("feeds/:feedId", "pages/edit-feed/edit-feed.tsx"),
  route("feeds", "pages/feeds/feeds.tsx"),
  route("categories/:categoryId/entries", "pages/categories/entries.tsx"),
  route("categories/:categoryId/feeds", "pages/categories/feeds.tsx"),
  route("categories", "pages/categories/categories.tsx"),
  route("login", "pages/login/login.tsx")
] satisfies RouteConfig;
