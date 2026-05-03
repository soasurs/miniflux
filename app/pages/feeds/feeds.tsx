import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { toast } from "sonner";
import AppNav from "~/components/app-nav";
import FeedCard from "~/components/feed";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useMiniflux } from "~/lib/miniflux/context";

function AddFeedDialog(props: {
  open: boolean
  onClose: () => void
}) {
  const [feedUrl, setFeedUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { client } = useMiniflux()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return
    setError(null)
    setLoading(true)
    try {
      const result = await client.createFeed(feedUrl)
      if (!result.ok) {
        setError(result.error.error_message)
        return
      }
      toast.success("Feed added successfully", { position: "top-right" })
      await queryClient.invalidateQueries({ queryKey: ["feeds"] })
      await queryClient.invalidateQueries({ queryKey: ["counters"] })
      setFeedUrl("")
      props.onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add feed")
    } finally {
      setLoading(false)
    }
  }

  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Add Feed</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="feed-url">Feed URL</Label>
              <Input
                id="feed-url"
                type="url"
                placeholder="https://example.org/feed.xml"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function Feeds() {
  const queryKey = ["feeds"]
  const { client, ready } = useMiniflux()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { status: feedsStatus, error: feedsError, data: feeds } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not ready")
      }
      return await client.getFeeds()
    },
    enabled: !!client && ready
  })

  const { status: countersStatus, error: countersError, data: counters } = useQuery({
    queryKey: ["counters"],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not ready")
      }
      return await client.getCounters()
    },
    enabled: !!client && ready
  })

  const refreshAllFeedsMutation = useMutation({
    mutationFn: async () => {
      await client?.refreshAllFeeds()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKey })
    }
  })

  let content: JSX.Element

  if (feedsStatus === "pending" || countersStatus === "pending") {
    content = <div className="p-8 text-center text-muted-foreground animate-pulse">Loading feeds...</div>
  } else if (feedsStatus === 'error' || countersStatus === 'error') {
    content = <div className="p-4 text-red-500">❌ {feedsError?.message || countersError?.message}</div>
  } else if (!feeds.ok || !counters.ok) {
    content = <div>⚠️ Failed to fetch data</div>
  } else {
    content = <ul className="flex flex-col gap-3">
      {feeds.data.map((feed) => (
        <FeedCard
          key={feed.id}
          feed={feed}
          reads={counters.data.reads?.[feed.id.toString()] ?? 0}
          unreads={counters.data.unreads?.[feed.id.toString()] ?? 0}
        />
      ))}
    </ul>
  }

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Feeds</h1>
          <p className="text-sm text-muted-foreground">Manage your feeds</p>
          <div className="flex gap-2">
            <Button type="button" variant='outline' onClick={() => setShowAddDialog(true)}>
              <PlusIcon data-icon="inline-start" />Add feed
            </Button>
            <Button type="button" variant='outline' onClick={() => refreshAllFeedsMutation.mutate()}>
              {refreshAllFeedsMutation.status === 'pending' ?
                "Refreshing..."
                :
                <><RefreshCwIcon data-icon="inline-start" />Refresh all feeds in the background</>
              }
            </Button>
          </div>
        </header>
        {content}
      </main>
      <AddFeedDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  )
}

export default Feeds;