import { useParams } from "react-router"
import { EntryList } from "~/components/entry-list"

function CategoryEntries() {
  const { categoryId } = useParams()
  const numCategoryId = Number(categoryId)

  return (
    <EntryList
      queryKey={["category", String(categoryId), "entries"]}
      title="Category Entries"
      subtitle="All entries in this category."
      emptyTitle="No entries"
      emptySubtitle="This category has no entries yet."
      parent="unreads"
      buildFilter={(cursor) => ({
        category_id: numCategoryId,
        direction: "desc",
        order: "published_at",
        ...(cursor > 0 ? { before_entry_id: cursor } : {}),
      })}
    />
  )
}

export default CategoryEntries
