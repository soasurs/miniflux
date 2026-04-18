import EntryListPage from "~/components/entry-list-page"

function History() {
  return (
    <EntryListPage
      title="History"
      description="Entries you have already finished reading."
      status="read"
      listPath="/history"
      infinite
      pageSize={20}
      emptyTitle="No reading history yet"
      emptyDescription="Marked-as-read entries will show up here."
    />
  )
}

export default History
