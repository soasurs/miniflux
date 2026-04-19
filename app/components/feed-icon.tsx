import { useQuery } from "@tanstack/react-query"
import { useMiniflux } from "~/lib/miniflux/context"

export function FeedIcon(props: { feed_id: number }) {
  const { client, ready } = useMiniflux()

  const { isPending, error, data } = useQuery({
    queryKey: [`feed-${props.feed_id}`],
    queryFn: async () => {
      return await client!.getFeedIconById(props.feed_id)
    },
    enabled: !!client && ready,
    staleTime: Infinity
  })

  if (error || !data || !data.ok) {
    return <img></img>
  }

  const icon = data.data.data

  return (
    <>
      {isPending ?
        <img className="w-6 h-6"></img>
        :
        <img src={`data:${icon}`} className="w-6 h-6"></img>
      }
    </>
  )
}