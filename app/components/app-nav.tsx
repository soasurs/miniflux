import { NavLink } from "react-router"
import { cn } from "~/lib/utils"

const navLinkClassName =
  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"

function AppNav({ containerClassName }: { containerClassName?: string }) {
  return (
    <nav className={cn("mx-auto px-4 pt-6 md:pt-8", containerClassName)}>
      <div className="inline-flex rounded-xl border border-border bg-card p-1 text-muted-foreground shadow-sm">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(navLinkClassName, isActive && "bg-foreground text-background hover:bg-foreground hover:text-background")
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            cn(navLinkClassName, isActive && "bg-foreground text-background hover:bg-foreground hover:text-background")
          }
        >
          History
        </NavLink>
        <NavLink
          to="/bookmarks"
          className={({ isActive }) =>
            cn(navLinkClassName, isActive && "bg-foreground text-background hover:bg-foreground hover:text-background")
          }
        >
          Bookmarks
        </NavLink>
        <NavLink
          to="/feeds"
          className={({ isActive }) =>
            cn(navLinkClassName, isActive && "bg-foreground text-background hover:bg-foreground hover:text-background")
          }
        >
          Feeds
        </NavLink>
      </div>
    </nav>
  )
}

export default AppNav
