import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type JSX } from "react";
import { toast } from "sonner";
import AppNav from "~/components/app-nav";
import FeedCard from "~/components/feed";
import { type Counters, type Feed } from "~/lib/miniflux/client";
import { useMiniflux } from "~/lib/miniflux/context";

function Feeds() {
  const { client, ready } = useMiniflux()

  const { status: feedsStatus, error: feedsError, data: feeds } = useQuery({
    queryKey: ["feeds"],
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
        </header>
        {content}
      </main>
    </div>
  )
}

export default Feeds;