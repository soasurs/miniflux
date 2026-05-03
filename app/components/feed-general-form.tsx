import { useForm } from "@tanstack/react-form"
import * as z from 'zod'
import type { Feed } from "~/lib/miniflux/client"
import { useMiniflux } from "~/lib/miniflux/context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Field, FieldGroup, FieldLabel } from "./ui/field"
import { useQuery } from "@tanstack/react-query"
import { Select, SelectValue, SelectTrigger, SelectContent, SelectGroup, SelectLabel, SelectItem } from "./ui/select"
import { useMemo, useState } from "react"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { Spinner } from "./ui/spinner"

const formSchema = z.object({
  category: z
    .number(),
  title: z
    .string()
    .min(1, "Title is required."),
  site_url: z
    .string()
    .min(1, "Site URL is required.")
    .url("Must be a valid URL."),
  feed_url: z
    .string()
    .min(1, "Feed URL is required.")
    .url("Must be a valid URL."),
  do_not_refresh: z
    .boolean()
})

function FeedGeneralForm(props: { feed: Feed }) {
  const categoriesQueryKey = ['categories']
  const { client, ready } = useMiniflux()
  const [serverError, setServerError] = useState<string | null>(null)
  const { status, error, data: categories } = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      return await client!.getCategories()
    },
    enabled: !!client && ready
  })

  const selectItems = useMemo(() => {
    if (!categories) return
    if (!categories.ok) return
    return categories.data.map((category) => {
      return { label: category.title, value: category.id }
    })
  }, [categories])

  const form = useForm({
    defaultValues: {
      category: props.feed.category.id,
      title: props.feed.title,
      site_url: props.feed.site_url,
      feed_url: props.feed.feed_url,
      do_not_refresh: props.feed.disabled
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const result = await client?.updateFeed(props.feed.id, {
        category_id: value.category,
        title: value.title,
        site_url: value.site_url,
        feed_url: value.feed_url,
        disabled: value.do_not_refresh
      })
      if (!result) {
        setServerError("Unable to connect to server.")
        return
      }
      if (!result.ok) {
        setServerError(result.error.error_message)
        return
      }
      toast.success("Update feed successfully", { position: "top-right" })
    }
  })

  if (status !== 'success') return

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form id="general" onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}>
          <FieldGroup>
            <form.Field
              name="category"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Category
                    </FieldLabel>
                    <div className="space-y-2">
                      <Select
                        items={selectItems}
                        value={field.state.value}
                        onValueChange={(e) => {
                          if (e !== null) {
                            field.handleChange(e)
                          }
                        }}
                      >
                        <SelectTrigger className='w-45' aria-invalid={isInvalid}>
                          <SelectValue placeholder='Select a category' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Categories</SelectLabel>
                            {selectItems?.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </Field>
                )
              }}
            >
            </form.Field>
            <form.Field
              name='title'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Title
                    </FieldLabel>
                    <div className="space-y-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete='off'
                      />
                    </div>
                  </Field>
                )
              }}
            >
            </form.Field>
            <form.Field
              name='site_url'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Site URL
                    </FieldLabel>
                    <div className="space-y-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete='off'
                      />
                    </div>
                  </Field>
                )
              }}
            >
            </form.Field>
            <form.Field
              name='feed_url'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Feed URL
                    </FieldLabel>
                    <div className="space-y-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete='off'
                      />
                    </div>
                  </Field>
                )
              }}
            >
            </form.Field>
            <form.Field
              name='do_not_refresh'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid} orientation='horizontal'>
                    <Checkbox
                      id={field.name}
                      name={field.name}
                      aria-invalid={isInvalid}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                    />
                    <FieldLabel htmlFor={field.name}>
                      Do not refresh this feed
                    </FieldLabel>
                  </Field>
                )
              }}
            >
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        <Field>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" variant='default' form="general">
                {isSubmitting
                  ? <><Spinner data-icon='inline-start' /> Updating...</>
                  : form.state.isSubmitted
                    ? "Updated"
                    : "Update"
                }
              </Button>
            )}
          </form.Subscribe>
        </Field>
      </CardFooter>
    </Card>
  )
}

export default FeedGeneralForm;