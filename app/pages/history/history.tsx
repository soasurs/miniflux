import { EntryList } from "~/components/entry-list"

function History() {
  return (
    <EntryList
      queryKey={["history"]}
      title="History"
      subtitle="Entries you have already finished reading."
      emptyTitle="No read entries"
      emptySubtitle="Read some entries and they will appear here."
      parent="history"
      buildFilter={(cursor) => ({
        status: "read",
        direction: "desc",
        order: "published_at",
        ...(cursor > 0 ? { before_entry_id: cursor } : {}),
      })}
    />
  )
}

export default History
