import { useLocation } from "react-router"
import type { Feed } from "~/lib/miniflux/client"
import AppNav from "~/components/app-nav";

import FeedGeneralForm from "~/components/feed-general-form";

type EditFeedRouteState = {
  feed: Feed
}

function EditFeed() {
  const location = useLocation()
  const state = location.state as EditFeedRouteState | null;

  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Edit feed</h1>
          {/* <p className="text-sm text-muted-foreground">Manage your categories</p> */}
        </header>
        {!state ?
          <div>Feed not found</div>
          :
          <FeedGeneralForm feed={state.feed}/>
        }
      </main>
    </div>
  )
}

export default EditFeed;