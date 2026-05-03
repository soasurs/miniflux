function EntryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3 flex-1">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        </div>
        <div className="h-5 bg-muted rounded-full w-16 shrink-0" />
      </div>
    </div>
  )
}

export { EntryCardSkeleton }
