import { Link } from 'react-router'
import type { Entry } from '~/lib/miniflux/client'

function formatPublishedAt(value: string) {
  return new Date(value).toLocaleDateString()
}

function EntryCard(props: { entry: Entry }) {
  return (
    <li className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/35">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <Link
            to={`/entry/${props.entry.id}`}
            className="block text-lg font-semibold leading-snug text-foreground hover:text-primary"
          >
            {props.entry.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{props.entry.feed.title}</span>
            {props.entry.author && <span>·</span>}
            {props.entry.author && <span>{props.entry.author}</span>}
            <span>·</span>
            <span>{formatPublishedAt(props.entry.published_at)}</span>
            <span>·</span>
            <span>{props.entry.reading_time} min read</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
          {props.entry.feed.category.title}
        </span>
      </div>
    </li>
  )
}

export default EntryCard
