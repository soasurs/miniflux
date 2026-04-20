import { useInfiniteQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import AppNav from "~/components/app-nav"
import { Button, buttonVariants } from "~/components/ui/button"
import { useMiniflux } from "~/lib/miniflux/context"
import EntryCard from "~/components/entry"
import { Fragment } from "react/jsx-runtime"
import type { EntryFilter } from "~/lib/miniflux/client"
import { useEffect, useMemo, useRef } from "react"

function Bookmarks() {
  const pageSize = 20;
  const queryKey = ['bookmarks']
  const { client, ready } = useMiniflux()
  const {
    status,
    error,
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching
  } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: async (pageParam) => {
      const params: EntryFilter = {
        starred: true,
        limit: pageSize,
        direction: 'desc',
        order: 'published_at'
      }
      if (pageParam.pageParam != 0) {
        params.before_entry_id = pageParam.pageParam
      }
      return await client?.getEntries(params)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      if (!lastPage.ok) return undefined

      const entries = lastPage.data.entries
      if (!entries || entries.length === 0) return undefined
      if (entries.length < pageSize) return undefined

      return entries[entries.length - 1].id
    },
    enabled: !!client && ready,
  })

  const allEntries = useMemo(() => {
    return data?.pages
      .filter((page): page is NonNullable<typeof page> => !!page)
      .filter(page => page.ok)
      .flatMap(page => page.data.entries)
  }, [data?.pages])


  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, {
      threshold: 0.1,
      rootMargin: '150px 0px',
    }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">Entries you saved for later, across both unread and read items.</p>
        </header>
        {status === 'pending' ?
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Loading entries...
          </div>
          : !client ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Sign in to view your entries</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect your Miniflux account first, then your feeds will appear here.
              </p>
              <Link to="/login" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
                Go to login
              </Link>
            </div>
          ) : error || !data ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Unable to load entries</h2>
              <p className="mt-2 text-sm text-destructive">{error.message}</p>
            </div>
          ) : data.pages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold">No bookmarks</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add more entries to bookmark!</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.pages.map((group, i) => (
                <Fragment key={i}>
                  {!!group && group.ok &&
                    <>
                      {group.data.entries.map((entry) => {
                        const currentIndex = allEntries?.findIndex(e => e.id === entry.id)
                        const prevEntryId = () => {
                          if (!allEntries || currentIndex! - 1 < 0) {
                            return undefined
                          }
                          return allEntries[currentIndex! - 1].id
                        }
                        const nextEntryId = () => {
                          if (!allEntries || currentIndex! + 1 >= allEntries.length) {
                            return undefined
                          }
                          return allEntries[currentIndex! + 1].id
                        }
                        return <EntryCard
                          key={entry.id}
                          entry={entry}
                          parent="bookmarks"
                          prevEntryId={prevEntryId()}
                          nextEntryId={nextEntryId()}
                        />
                      })}
                    </>
                  }
                </Fragment>
              ))}
            </ul>
          )
        }
        <div className="pt-4 space-y-2">
          <div ref={loadMoreRef} className="h-1">
            {isFetchingNextPage &&
              <div className="text-center text-sm text-muted-foreground animate-pulse">
                Loading more...
              </div>
            }
            {!hasNextPage &&
              <div className="text-center text-sm text-muted-foreground">
                Nothing more to load
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  )
}

export default Bookmarks
