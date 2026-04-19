import { useEffect, useState } from "react"
import { Link } from 'react-router'
import type { Feed, Counters } from "~/lib/miniflux/client"
import { useMiniflux } from "~/lib/miniflux/context"
import { Button } from "./ui/button"
import { toast } from "sonner"

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
  const [icon, setIcon] = useState<string>('')

  const fetchFeedIcon = async () => {
    if (!ready) {
      return
    }

    if (!client) {
      return
    }

    try {
      const icon = await client.getFeedIconById(props.feed.id)
      if (!icon.ok) {
        toast.error("Error", {
          description: icon.error.error_message
        })
        return
      }
      setIcon(icon.data.data)
    } catch (e) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Failed to fetch feed's icon"
      })
      return
    }
  }

  const refreshFeed = async () => {
    if (!client) {
      return
    }

    try {
      client.refreshFeed(props.feed.id)
    } catch (e) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Failed to refresh feed"
      })
      return
    }
  }

  const removeFeed = async () => {
    if (!client) {
      return
    }

    try {
      client.removeFeed(props.feed.id)
    } catch (e) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Failed to remove feed"
      })
      return
    }
  }

  useEffect(() => {
    fetchFeedIcon()
  }, [client, ready, props.feed.id])

  return (
    <li className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/35 gap-2">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`data:${icon}`} className="w-6 h-6"></img>
          <Link to={`/feeds/${props.feed.id}`} className="text-xl">{props.feed.title}</Link>
          <span>({props.unreads}/{props.reads})</span>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{props.feed.category.title}</span>
      </div>
      <div className="flex gap-3 items-center">
        <a href={props.feed.site_url} className="hover:underline">{props.feed.site_url}</a>
        <p>Last checked: {formatLastCheckedAt(props.feed.checked_at)}</p>
      </div>
      <div className="flex gap-3 items-center">
        <Button
          type="button"
          variant="outline"
          onClick={refreshFeed}
        >
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={removeFeed}
        >
          Remove
        </Button>
      </div>
    </li>
  )
}

export default FeedCard;