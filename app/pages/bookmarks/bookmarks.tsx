import { EntryList } from "~/components/entry-list"

function Bookmarks() {
  return (
    <EntryList
      queryKey={["bookmarks"]}
      title="Bookmarks"
      subtitle="Entries you saved for later, across both unread and read items."
      emptyTitle="No bookmarks"
      emptySubtitle="Bookmark entries to save them for later."
      parent="bookmarks"
      buildFilter={(cursor) => ({
        starred: true,
        direction: "desc",
        order: "published_at",
        ...(cursor > 0 ? { before_entry_id: cursor } : {}),
      })}
    />
  )
}

export default Bookmarks
