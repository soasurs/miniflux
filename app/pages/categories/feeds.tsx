import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"
import type { JSX } from "react"
import AppNav from "~/components/app-nav"
import FeedCard from "~/components/feed"
import { useMiniflux } from "~/lib/miniflux/context"

function CategoryFeeds() {
  const { categoryId } = useParams()
  const { client, ready } = useMiniflux()

  const { status, error, data } = useQuery({
    queryKey: ["category", categoryId, "feeds"],
    queryFn: async () => {
      if (!client) throw new Error("Client not ready")
      return await client.getCategoryFeeds(Number(categoryId))
    },
    enabled: !!client && ready && !!categoryId,
  })

  let content: JSX.Element

  if (status === "pending") {
    content = <div className="p-8 text-center text-muted-foreground animate-pulse">Loading feeds...</div>
  } else if (status === "error") {
    content = <div className="p-4 text-destructive">Failed to fetch feeds: {error.message}</div>
  } else if (!data || !data.ok) {
    content = <div className="p-4 text-destructive">Failed to fetch feeds: {data?.error.error_message}</div>
  } else {
    content = (
      <ul className="flex flex-col gap-3">
        {data.data.map((feed) => (
          <FeedCard key={feed.id} feed={feed} reads={0} unreads={0} />
        ))}
      </ul>
    )
  }

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Category Feeds</h1>
          <p className="text-sm text-muted-foreground">Feeds in this category.</p>
        </header>
        {content}
      </main>
    </div>
  )
}

export default CategoryFeeds
