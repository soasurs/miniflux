import EntryListPage from "~/components/entry-list-page"

export function Home() {
  return (
    <EntryListPage
      title="Home"
      description="All unread entries across your subscriptions."
      status="unread"
      listPath="/"
      emptyTitle="Inbox zero"
      emptyDescription="Everything unread has been cleared for now."
    />
  )
}

export default Home
