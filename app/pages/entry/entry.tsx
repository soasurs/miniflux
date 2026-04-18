import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import AppNav from "~/components/app-nav"
import type { EntryLinkState } from "~/components/entry"
import { Button, buttonVariants } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import type { Entry } from "~/lib/miniflux/client"
import { useMiniflux } from "~/lib/miniflux/context"

function formatPublishedAt(value: string) {
  return new Date(value).toLocaleString()
}

function entryBodyClassName() {
  return "max-w-none text-[1.02rem] leading-8 text-foreground selection:bg-primary/12 [&>*:first-child]:mt-0 [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:decoration-primary/70 [&_blockquote]:my-6 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:bg-muted/35 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:italic [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_em]:italic [&_figure]:my-8 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-tight [&_hr]:my-8 [&_hr]:border-border [&_iframe]:my-8 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_img]:my-8 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_li]:marker:text-muted-foreground [&_ol]:my-5 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:my-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/60 [&_pre]:p-4 [&_strong]:font-semibold [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-5 [&_ul]:ml-6 [&_ul]:list-disc"
}

function EntryPage() {
  const { entryId } = useParams()
  const location = useLocation()
  const parsedEntryId = Number(entryId)
  const { client, ready } = useMiniflux()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<"status" | "bookmark" | null>(null)

  useEffect(() => {
    if (!Number.isInteger(parsedEntryId) || parsedEntryId <= 0) {
      setError("Invalid entry id")
      setLoading(false)
      return
    }

    if (!ready) {
      return
    }

    if (!client) {
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchEntry = async () => {
      setLoading(true)
      setError(null)
      setActionError(null)

      try {
        const ret = await client.getEntry(parsedEntryId)
        if (!ret.ok) {
          if (!cancelled) {
            setError(ret.error.error_message)
            setEntry(null)
          }
          return
        }

        let nextEntry = ret.data

        if (nextEntry.status === "unread") {
          const markReadRet = await client.updateEntries([nextEntry.id], "read")
          if (!markReadRet.ok) {
            if (!cancelled) {
              setActionError(markReadRet.error.error_message)
            }
          } else {
            nextEntry = { ...nextEntry, status: "read" }
          }
        }

        if (!cancelled) {
          setEntry(nextEntry)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Retrieve entry failed")
          setEntry(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchEntry()

    return () => {
      cancelled = true
    }
  }, [client, parsedEntryId, ready])

  if (!ready || loading) {
    return (
      <div className="pb-8 md:pb-10">
        <AppNav containerClassName="max-w-4xl" />
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground shadow-sm">
            Loading entry...
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="pb-8 md:pb-10">
        <AppNav containerClassName="max-w-4xl" />
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Sign in to view this entry</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Miniflux client is not connected yet.
            </p>
            <Link to="/login" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="pb-8 md:pb-10">
        <AppNav containerClassName="max-w-4xl" />
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-foreground">Unable to load entry</h1>
            <p className="mt-2 text-sm text-destructive">
              {error ?? "The entry could not be found."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentClient = client
  const currentEntry = entry
  const isRead = currentEntry.status === "read"
  const linkState = location.state as EntryLinkState | null
  const currentIndex = linkState?.entryIds.indexOf(currentEntry.id) ?? -1
  const prevEntryId = currentIndex > 0 ? linkState?.entryIds[currentIndex - 1] : null
  const nextEntryId = currentIndex >= 0 && currentIndex < (linkState?.entryIds.length ?? 0) - 1
    ? linkState?.entryIds[currentIndex + 1]
    : null

  async function handleToggleRead() {
    setPendingAction("status")
    setActionError(null)

    try {
      const nextStatus = isRead ? "unread" : "read"
      const ret = await currentClient.updateEntries([currentEntry.id], nextStatus)
      if (!ret.ok) {
        setActionError(ret.error.error_message)
        return
      }

      setEntry({ ...currentEntry, status: nextStatus })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Update entry status failed")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleToggleBookmark() {
    setPendingAction("bookmark")
    setActionError(null)

    try {
      const ret = await currentClient.toggleEntryBookmark(currentEntry.id)
      if (!ret.ok) {
        setActionError(ret.error.error_message)
        return
      }

      setEntry({ ...currentEntry, starred: !currentEntry.starred })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Toggle bookmark failed")
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <article className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          <header className="space-y-4 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">{currentEntry.feed.category.title}</span>
              <span className="rounded-full bg-muted px-2 py-1">{currentEntry.feed.title}</span>
              <span className="rounded-full bg-muted px-2 py-1 capitalize">{currentEntry.status}</span>
              {currentEntry.starred && <span className="rounded-full bg-muted px-2 py-1">Starred</span>}
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">
              {currentEntry.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {currentEntry.author && <span>{currentEntry.author}</span>}
              <span>{formatPublishedAt(currentEntry.published_at)}</span>
              <span>{currentEntry.reading_time} min read</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant={isRead ? "outline" : "default"}
                size="sm"
                onClick={handleToggleRead}
                disabled={pendingAction !== null}
              >
                {pendingAction === "status"
                  ? "Updating..."
                  : isRead
                    ? "Mark as unread"
                    : "Mark as read"}
              </Button>
              <Button
                variant={currentEntry.starred ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleBookmark}
                disabled={pendingAction !== null}
              >
                {pendingAction === "bookmark"
                  ? "Saving..."
                  : currentEntry.starred
                    ? "Remove bookmark"
                    : "Bookmark"}
              </Button>
              <a
                href={currentEntry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Open original
              </a>
              {currentEntry.comments_url && (
                <a
                  href={currentEntry.comments_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Comments
                </a>
              )}
            </div>
            {actionError && (
              <p className="text-sm text-destructive">{actionError}</p>
            )}
          </header>
          <Separator />
          <div className="p-6 md:p-8">
            {currentEntry.content ? (
              <div
                className={entryBodyClassName()}
                // Miniflux entry content is already sanitized for reader display.
                dangerouslySetInnerHTML={{ __html: currentEntry.content }}
              />
            ) : (
              <p className="text-muted-foreground">This entry does not contain readable content.</p>
            )}
          </div>
        </article>
        {(prevEntryId || nextEntryId) && (
          <div className="mt-4 flex items-center justify-between gap-3">
            {prevEntryId ? (
              <Link
                to={`/entry/${prevEntryId}`}
                state={linkState}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            ) : (
              <div />
            )}
            {nextEntryId ? (
              <Link
                to={`/entry/${nextEntryId}`}
                state={linkState}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EntryPage
