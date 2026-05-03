import { NavLink } from "react-router"
import { SunIcon, MoonIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "~/lib/utils"

const navLinkClassName =
  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span className="inline-flex h-8 w-8 shrink-0" />
  }

  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  )
}

function AppNav({ containerClassName }: { containerClassName?: string }) {
  return (
    <nav className={cn("mx-auto px-4 pt-6 md:pt-8", containerClassName)}>
      <div className="flex items-center gap-2">
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
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              cn(navLinkClassName, isActive && "bg-foreground text-background hover:bg-foreground hover:text-background")
            }
          >
            Categories
          </NavLink>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}

export default AppNav
