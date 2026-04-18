import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import EntryCard from "~/components/entry"
import AppNav from "~/components/app-nav"
import { buttonVariants } from "~/components/ui/button"
import type { Entry } from "~/lib/miniflux/client"
import { useMiniflux } from "~/lib/miniflux/context"

interface EntryListPageProps {
  title: string
  description: string
  status?: "read" | "unread"
  starred?: boolean
  listPath: string
  infinite?: boolean
  pageSize?: number
  emptyTitle: string
  emptyDescription: string
}

function EntryListPage(props: EntryListPageProps) {
  const { client, ready } = useMiniflux()
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreStateRef = useRef(false)
  const pageSize = props.pageSize ?? 20

  useEffect(() => {
    if (!ready) {
      return
    }

    if (!client) {
      setEntries([])
      setError(null)
      setLoading(false)
      setLoadingMore(false)
      loadingMoreStateRef.current = false
      setHasMore(false)
      return
    }

    let cancelled = false

    const fetchEntries = async () => {
      setLoading(true)
      setLoadingMore(false)
      loadingMoreStateRef.current = false
      setError(null)
      setEntries([])

      try {
        const ret = await client.getEntries({
          status: props.status,
          starred: props.starred,
          order: "published_at",
          direction: "desc",
          offset: 0,
          limit: props.infinite ? pageSize : undefined,
        })

        if (!ret.ok) {
          if (!cancelled) {
            setError(ret.error.error_message)
            setEntries([])
            setHasMore(false)
          }
          return
        }

        if (!cancelled) {
          setEntries(ret.data.entries)
          setHasMore(props.infinite ? ret.data.entries.length < ret.data.total : false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Retrieve entries failed")
          setEntries([])
          setHasMore(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchEntries()

    return () => {
      cancelled = true
    }
  }, [client, pageSize, props.infinite, props.starred, props.status, ready])

  useEffect(() => {
    if (!props.infinite || !ready || !client || !hasMore || loading || !loadMoreRef.current) {
      return
    }

    let cancelled = false
    const node = loadMoreRef.current

    const observer = new IntersectionObserver(
      (observedEntries) => {
        if (!observedEntries[0]?.isIntersecting) {
          return
        }

        if (loadingMoreStateRef.current) {
          return
        }

        observer.disconnect()
        loadingMoreStateRef.current = true
        setLoadingMore(true)

        void (async () => {
          try {
            setError(null)
            const ret = await client.getEntries({
              status: props.status,
              starred: props.starred,
              order: "published_at",
              direction: "desc",
              offset: entries.length,
              limit: pageSize,
            })

            if (!ret.ok) {
              if (!cancelled) {
                setError(ret.error.error_message)
              }
              return
            }

            if (!cancelled) {
              setEntries((currentEntries) => [...currentEntries, ...ret.data.entries])
              setHasMore(entries.length + ret.data.entries.length < ret.data.total)
            }
          } catch (e) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : "Retrieve entries failed")
            }
          } finally {
            if (!cancelled) {
              loadingMoreStateRef.current = false
              setLoadingMore(false)
            }
          }
        })()
      },
      { rootMargin: "240px 0px" }
    )

    observer.observe(node)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [client, entries.length, hasMore, loading, pageSize, props.infinite, props.starred, props.status, ready])

  const entryIds = entries.map((entry) => entry.id)

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{props.title}</h1>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </header>

        {!ready || loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Loading entries...
          </div>
        ) : !client ? (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Sign in to view your entries</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Miniflux account first, then your feeds will appear here.
            </p>
            <Link to="/login" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
              Go to login
            </Link>
          </div>
        ) : error && entries.length === 0 ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Unable to load entries</h2>
            <p className="mt-2 text-sm text-destructive">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">{props.emptyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{props.emptyDescription}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                entryIds={entryIds}
                listPath={props.listPath}
              />
            ))}
          </ul>
        )}
        {props.infinite && entries.length > 0 && (
          <div ref={loadMoreRef} className="pt-4">
            {error && (
              <p className="mb-3 text-center text-sm text-destructive">{error}</p>
            )}
            {loadingMore && (
              <p className="text-center text-sm text-muted-foreground">Loading more entries...</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default EntryListPage
