import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { useParams } from "react-router"
import AppNav from "~/components/app-nav"
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
  const numEntryId = Number(entryId)
  const { client, ready } = useMiniflux()
  const queryClient = useQueryClient()
  const queryKey = [`feeds/${numEntryId}`]
  const unreadsQueryKey = ['unreads']
  const bookmarksQueryKey = ['bookmarks']
  const { status, error, data, isSuccess } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      return await client?.getEntry(numEntryId)
    },
    enabled: !!client && ready,
  })

  const markEntryRead = async () => {
    if (!data || !data.ok) return
    if (data.data.status === 'unread') {
      await client?.updateEntries([numEntryId], 'read')
    }
  }

  const isFirstLoad = useRef(false)
  useEffect(() => {
    if (isSuccess && data) {
      if (!isFirstLoad.current) {
        markEntryRead()
      }
    }
  }, [isSuccess, data])

  const toggleReadStatusMutation = useMutation({
    mutationFn: async (entry: Entry) => {
      let nextStatus = entry.status
      if (nextStatus === 'read') {
        nextStatus = 'unread'
      } else if (nextStatus === 'unread') {
        nextStatus = 'read'
      }
      await client?.updateEntries([entry.id], nextStatus)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...queryKey, unreadsQueryKey] })
    }
  })

  const toggleBookmarkStatusMutation = useMutation({
    mutationFn: async (entry: Entry) => {
      await client?.toggleEntryBookmark(entry.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...queryKey, bookmarksQueryKey] })
    }
  })

  if (status === 'pending') {
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
  } else if (status === 'error') {
    return (
      <div className="pb-8 md:pb-10">
        <AppNav containerClassName="max-w-4xl" />
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-foreground">Unable to load entry</h1>
            <p className="mt-2 text-sm text-destructive">
              ❌ Failed to fetch entry: {error.message}
            </p>
          </div>
        </div>
      </div>
    )
  } else if (!data || !data.ok) {
    return (
      <div className="pb-8 md:pb-10">
        <AppNav containerClassName="max-w-4xl" />
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-foreground">Unable to load entry</h1>
            <p className="mt-2 text-sm text-destructive">
              ⚠️ Failed to fetch entry: {data?.error.error_message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentEntry = data.data

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
                variant={currentEntry.status === 'read' ? "outline" : "default"}
                size="sm"
                onClick={() => toggleReadStatusMutation.mutate(currentEntry)}
                disabled={toggleReadStatusMutation.status === 'pending'}
              >
                {toggleReadStatusMutation.status === 'pending'
                  ? "Updating..."
                  : currentEntry.status === 'read'
                    ? "Mark as unread"
                    : "Mark as read"}
              </Button>
              <Button
                variant={currentEntry.starred ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleBookmarkStatusMutation.mutate(currentEntry)}
                disabled={toggleBookmarkStatusMutation.status === 'pending'}
              >
                {toggleBookmarkStatusMutation.status === 'pending'
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
      </div>
    </div>
  )
}

export default EntryPage
