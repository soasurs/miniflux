import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import AppNav from "~/components/app-nav"
import FeedGeneralForm from "~/components/feed-general-form"
import { useMiniflux } from "~/lib/miniflux/context"

function EditFeed() {
  const { feedId } = useParams()
  const { client, ready } = useMiniflux()

  const { status, error, data } = useQuery({
    queryKey: ["feed", feedId],
    queryFn: async () => {
      if (!client) throw new Error("Client not ready")
      return await client.getFeed(Number(feedId))
    },
    enabled: !!client && ready && !!feedId,
  })

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Edit feed</h1>
        </header>

        {status === "pending" ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm animate-pulse">
            Loading feed...
          </div>
        ) : status === "error" ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Unable to load feed
            </h2>
            <p className="mt-2 text-sm text-destructive">{error.message}</p>
          </div>
        ) : !data || !data.ok ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Feed not found
            </h2>
            <p className="mt-2 text-sm text-destructive">
              {data?.error?.error_message ?? "The requested feed could not be found."}
            </p>
          </div>
        ) : (
          <FeedGeneralForm feed={data.data} />
        )}
      </main>
    </div>
  )
}

export default EditFeed