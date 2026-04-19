import { Link } from 'react-router'
import type { Feed } from "~/lib/miniflux/client"
import { useMiniflux } from "~/lib/miniflux/context"
import { Button } from "./ui/button"
import { FeedIcon } from "./feed-icon"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

function formatLastCheckedAt(value: string): string {
  const date = new Date(value)
  if (isNaN(date.getTime())) return value

  const diffMs = Date.now() - date.getTime()
  const diffSeconds = diffMs / 1000
  const diffMinutes = Math.floor(diffSeconds / 60)

  if (diffMinutes <= 0) return 'now'

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours > 0) {
    return `${hours} hours ${minutes > 0 ? `${minutes} minutes` : ''} ago`
  }
  return `${minutes} minutes ago`
}

function FeedCard(props: { feed: Feed, reads: number, unreads: number }) {
  const { client, ready } = useMiniflux()
  const queryClient = useQueryClient()

  const refreshFeedMutation = useMutation({
    mutationFn: async () => {
      return await client!.refreshFeed(props.feed.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feeds"] })
    }
  })

  const removeFeedMutation = useMutation({
    mutationFn: async () => {
      return await client!.removeFeed(props.feed.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feeds"] })
    }
  })

  return (
    <li className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/35 gap-2">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <FeedIcon feed_id={props.feed.id} />
          <Link to={`/feeds/${props.feed.id}`} className="text-xl font-semibold">{props.feed.title}</Link>
          <span>({props.unreads}/{props.reads})</span>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{props.feed.category.title}</span>
      </div>
      <div className="flex gap-3 items-center">
        <a href={props.feed.site_url} className="hover:underline">{props.feed.site_url}</a>
        <p>Last checked: {formatLastCheckedAt(props.feed.checked_at)}</p>
      </div>
      <div className="flex gap-3 items-center">
        {refreshFeedMutation.status === 'pending' ?
          <Button
            type="button"
            variant="secondary"
            onClick={() => { refreshFeedMutation.mutate() }}
          >
            Refreshing...
          </Button>
          :
          <Button
            type="button"
            variant="outline"
            onClick={() => { refreshFeedMutation.mutate() }}
          >
            Refresh
          </Button>
        }
        <Button
          type="button"
          variant="outline"
        >
          Edit
        </Button>
        {removeFeedMutation.status === 'pending' ?
          <Button
            type="button"
            variant="destructive"
            onClick={() => { removeFeedMutation.mutate() }}
          >
            Removing
          </Button>
          :
          <Button
            type="button"
            variant="destructive"
            onClick={() => { removeFeedMutation.mutate() }}
          >
            Remove
          </Button>
        }
      </div>
    </li >
  )
}

export default FeedCard;