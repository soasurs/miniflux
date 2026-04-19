import { useEffect, useState } from "react";
import AppNav from "~/components/app-nav";
import FeedCard from "~/components/feed";
import { type Counters, type Feed } from "~/lib/miniflux/client";
import { useMiniflux } from "~/lib/miniflux/context";

function Feeds() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [counters, setCounters] = useState<Counters>()
  const { client, ready } = useMiniflux()

  const fetchFeeds = async () => {
    if (!ready) {
      return
    }

    if (!client) {
      return
    }

    try {
      const ret = await client.getFeeds()
      if (!ret.ok) {
        return
      }

      setFeeds(ret.data)
    }catch(e) {
      return
    }
  }

  const fetchCounters = async () => {
    if (!ready) {
      return
    }

    if (!client) {
      return
    }

    try {
      const ret = await client.getCounters()
      if (!ret.ok) {
        return
      }
      setCounters(ret.data)
    }catch(e) {
      return
    }
  }

  useEffect(() => {
    fetchFeeds()
    fetchCounters()
  }, [client, ready])

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Feeds</h1>
          <p className="text-sm text-muted-foreground">Manage your feeds</p>
        </header>
        <ul className="flex flex-col gap-3">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed} 
              reads={counters?.reads?.[feed.id.toString()] ?? 0}
              unreads={counters?.unreads?.[feed.id.toString()] ?? 0}
              />
          ))}
        </ul>
      </main>
    </div>
  )
}

export default Feeds;