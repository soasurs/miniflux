import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import type { Category } from "~/lib/miniflux/client";
import { useMiniflux } from "~/lib/miniflux/context";

function CategoryCard(props: { category: Category }) {
  const { client, ready } = useMiniflux()
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: async () => {
      await client?.deleteCategory(props.category.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await client?.markCategoryEntriesAsRead(props.category.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ["categories"]})
    }
  })

  return (
    <li className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/35 gap-2">
      <div className="flex gap-4 items-center">
        <a>{props.category.title}</a>
        <span>({props.category.total_unread})</span>
      </div>
      <div className="flex gap-4">
        <Link to='' className="hover:underline">Entries</Link>
        <Link to='' className="hover:underline">Feeds</Link>
        <Link to='#' className="hover:underline">Edit</Link>
        <a 
          href='#' 
          className="hover:underline"
          onClick={() => {
            markAllReadMutation.mutate()
          }}
        >
          Mark all as read
        </a>
        {props.category.feed_count == 0 &&
          <a
            href='#'
            className="text-red-400 hover:underline"
            onClick={() => {
              removeMutation.mutate()
            }}
          >
            Remove
          </a>
        }
      </div>
    </li>
  )
}

export default CategoryCard;