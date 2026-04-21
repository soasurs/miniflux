import React, { useState, type JSX } from "react"
import { useLocation, useParams } from "react-router"
import type { Feed } from "~/lib/miniflux/client"
import AppNav from "~/components/app-nav";
import { useQuery } from "@tanstack/react-query";
import { useMiniflux } from "~/lib/miniflux/context";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectGroup,
  SelectLabel
} from "~/components/ui/select";

type EditFeedRouteState = {
  feed: Feed
}

function EditFeed() {
  const { client, ready } = useMiniflux()
  const location = useLocation()
  const state = location.state as EditFeedRouteState | null;
  const categoriesQueryKey = ["categories"]
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(0)
  const { status, error, data } = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      return await client?.getCategories()
    },
    enabled: !!client && ready
  })

  if (!data || !data.ok) {
    return
  }

  const selectItems = data.data.map((category) => {
    return { label: category.title, value: category.id }
  })

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
          <form>
            <Card>
              <CardHeader>
                <CardTitle>
                  General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Select
                    items={selectItems}
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                  >
                    <SelectTrigger className='w-45'>
                      <SelectValue
                        placeholder='Select a category'
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categories</SelectLabel>
                        {selectItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </form>
        }
      </main>
    </div>
  )
}

export default EditFeed;