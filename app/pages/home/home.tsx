import { EntryList } from "~/components/entry-list"

function Home() {
  return (
    <EntryList
      queryKey={["unreads"]}
      title="Home"
      subtitle="All unread entries across your subscriptions."
      emptyTitle="No unread entries"
      emptySubtitle="Subscribe to more feeds to see entries here."
      parent="unreads"
      buildFilter={(cursor) => ({
        status: "unread",
        direction: "desc",
        order: "published_at",
        ...(cursor > 0 ? { before_entry_id: cursor } : {}),
      })}
    />
  )
}

export default Home
