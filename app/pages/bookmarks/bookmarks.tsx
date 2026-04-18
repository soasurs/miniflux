import EntryListPage from "~/components/entry-list-page"

function Bookmarks() {
  return (
    <EntryListPage
      title="Bookmarks"
      description="Entries you saved for later, across both unread and read items."
      starred
      listPath="/bookmarks"
      infinite
      pageSize={20}
      emptyTitle="No bookmarks yet"
      emptyDescription="Bookmarked entries will show up here."
    />
  )
}

export default Bookmarks
