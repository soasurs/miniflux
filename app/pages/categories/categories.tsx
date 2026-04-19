import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";
import CategoryCard from "~/components/category";
import AppNav from "~/components/app-nav";
import { useMiniflux } from "~/lib/miniflux/context";

function Categories() {
  const { client, ready } = useMiniflux()

  const { status, error, data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not ready")
      }
      return await client.getCategories(true)
    },
    enabled: !!client && ready
  })

  let content: JSX.Element

  if (status === 'pending') {
    content = <div className="p-8 text-center text-muted-foreground animate-pulse">Loading categories...</div>
  } else if (status === 'error') {
    content = <div className="p-8 text-center text-muted-foreground animate-pulse">❌ Failed to fetch categories: {error.message}</div>
  } else if (!categories.ok) {
    content = <div className="p-8 text-center text-muted-foreground animate-pulse">⚠️ Failed to fetch categories: {categories.error.error_message}</div>
  } else {
    content = <ul className="flex flex-col gap-2">
      {categories.data.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
        />
      ))}
    </ul>
  }
  return (
    <div className="pb-8 md:pb-10">
      <AppNav containerClassName="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage your categories</p>
        </header>
        {content}
      </main>
    </div>
  )
}

export default Categories;