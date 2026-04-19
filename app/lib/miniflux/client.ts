export enum AuthMode {
  Unspecified = 0,
  BasicAuth = 1,
  TokenAuth = 2
}

interface Client {
  authMode: AuthMode
  url: string
  username?: string
  password?: string
  token?: string

  // Feeds
  getFeeds(): Promise<Result<Feed[]>>
  getCategoryFeeds(category_id: number): Promise<Result<Feed[]>>
  getFeed(feed_id: number): Promise<Result<Feed>>
  getFeedIconById(feed_id: number): Promise<Result<FeedIcon>>
  getFeedIconByIconId(icon_id: number): Promise<Result<FeedIcon>>
  createFeed(feed_url: string, category_id?: number, options?: Partial<CreateFeedRequest>): Promise<Result<number>>
  updateFeed(feed_id: number, req: UpdateFeedRequest): Promise<Result<Feed>>
  refreshFeed(feed_id: number): Promise<Result<void>>
  refreshAllFeeds(): Promise<Result<void>>
  removeFeed(feed_id: number): Promise<Result<void>>
  markFeedEntriesAsRead(feed_id: number): Promise<Result<void>>
  getCounters(): Promise<Result<Counters>>

  // Entries
  getEntry(entry_id: number): Promise<Result<Entry>>
  getFeedEntry(feed_id: number, entry_id: number): Promise<Result<Entry>>
  getEntries(filter?: EntryFilter): Promise<Result<EntryResultSet>>
  getFeedEntries(feed_id: number, filter?: EntryFilter): Promise<Result<EntryResultSet>>
  getCategoryEntries(category_id: number, filter?: EntryFilter): Promise<Result<EntryResultSet>>
  updateEntry(entry_id: number, req: UpdateEntryRequest): Promise<Result<Entry>>
  updateEntries(entry_ids: number[], status: EntryStatus): Promise<Result<void>>
  toggleEntryBookmark(entry_id: number): Promise<Result<void>>
  saveEntry(entry_id: number): Promise<Result<void>>
  fetchEntryContent(entry_id: number, update_content?: boolean): Promise<Result<{ content: string }>>
  markUserEntriesAsRead(user_id: number): Promise<Result<void>>

  // Categories
  getCategories(counts?: boolean): Promise<Result<Category[]>>
  createCategory(title: string, hide_globally?: boolean): Promise<Result<Category>>
  updateCategory(category_id: number, title?: string, hide_globally?: boolean): Promise<Result<Category>>
  deleteCategory(category_id: number): Promise<Result<void>>
  refreshCategoryFeeds(category_id: number): Promise<Result<void>>
  markCategoryEntriesAsRead(category_id: number): Promise<Result<void>>

  // Users
  getCurrentUser(): Promise<Result<User>>
  getUsers(): Promise<Result<User[]>>
  getUser(user_id_or_username: number | string): Promise<Result<User>>
  createUser(req: CreateUserRequest): Promise<Result<User>>
  updateUser(user_id: number, req: UpdateUserRequest): Promise<Result<User>>
  deleteUser(user_id: number): Promise<Result<void>>

  // Enclosures
  getEnclosure(enclosure_id: number): Promise<Result<Enclosure>>
  updateEnclosure(enclosure_id: number, media_progression: number): Promise<Result<void>>

  // Misc
  discover(url: string): Promise<Result<Subscription[]>>
  exportOPML(): Promise<Result<string>>
  importOPML(opml: string): Promise<Result<{ message: string }>>
  flushHistory(): Promise<Result<void>>
  version(): Promise<Result<VersionInfo>>
  getApiKeys(): Promise<Result<ApiKey[]>>
  createApiKey(description: string): Promise<Result<ApiKey>>
  deleteApiKey(api_key_id: number): Promise<Result<void>>
}

export class MinifluxClient implements Client {
  authMode: AuthMode = AuthMode.Unspecified
  url: string
  username?: string | undefined = ""
  password?: string | undefined = ""
  token?: string | undefined = ""

  constructor(
    authMode: AuthMode,
    url: string,
    username?: string,
    password?: string,
    token?: string
  ) {
    this.authMode = authMode
    this.url = url
    this.username = username
    this.password = password
    this.token = token
    if (!url) {
      throw new Error("empty url")
    }
    if (!username && !password && !token) {
      throw new Error("invalid credential")
    }
  }

  private buildHeaders(): Headers {
    const headers = new Headers()
    if (this.authMode === AuthMode.BasicAuth) {
      headers.set('Authorization', 'Basic ' + btoa(this.username! + ":" + this.password!))
    } else {
      headers.set('X-Auth-Token', this.token!)
    }
    return headers
  }

  private buildQuery(params: object): string {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const v of value) qs.append(key, String(v))
      } else {
        qs.set(key, String(value))
      }
    }
    const str = qs.toString()
    return str ? `?${str}` : ''
  }

  private async request<T>(path: string, method: string = "GET", body?: unknown): Promise<Result<T>> {
    const headers = this.buildHeaders()
    if (body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }
    const req = new Request(this.url.trim() + path, {
      headers,
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const response = await fetch(req)
    if (!response.ok) {
      const error: ApiError = await response.json()
      return { ok: false, error }
    }
    if (response.status === 204 || response.status === 202) {
      return { ok: true, data: undefined as T }
    }
    const data: T = await response.json()
    return { ok: true, data }
  }

  private async requestText(path: string, method: string = "GET", body?: string): Promise<Result<string>> {
    const headers = this.buildHeaders()
    if (body !== undefined) {
      headers.set('Content-Type', 'text/xml')
    }
    const req = new Request(this.url.trim() + path, { headers, method, body })
    const response = await fetch(req)
    if (!response.ok) {
      const error: ApiError = await response.json()
      return { ok: false, error }
    }
    const data = await response.text()
    return { ok: true, data }
  }

  // Feeds

  async getFeeds(): Promise<Result<Feed[]>> {
    return this.request<Feed[]>("/v1/feeds")
  }

  async getCategoryFeeds(category_id: number): Promise<Result<Feed[]>> {
    return this.request<Feed[]>(`/v1/categories/${category_id}/feeds`)
  }

  async getFeed(feed_id: number): Promise<Result<Feed>> {
    return this.request<Feed>(`/v1/feeds/${feed_id}`)
  }

  async getFeedIconById(feed_id: number): Promise<Result<FeedIcon>> {
    return this.request<FeedIcon>(`/v1/feeds/${feed_id}/icon`)
  }

  async getFeedIconByIconId(icon_id: number): Promise<Result<FeedIcon>> {
    return this.request<FeedIcon>(`/v1/icons/${icon_id}`)
  }

  async createFeed(feed_url: string, category_id?: number, options?: Partial<CreateFeedRequest>): Promise<Result<number>> {
    const result = await this.request<{ feed_id: number }>("/v1/feeds", "POST", { feed_url, category_id, ...options })
    if (!result.ok) return result
    return { ok: true, data: result.data.feed_id }
  }

  async updateFeed(feed_id: number, req: UpdateFeedRequest): Promise<Result<Feed>> {
    return this.request<Feed>(`/v1/feeds/${feed_id}`, "PUT", req)
  }

  async refreshFeed(feed_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/feeds/${feed_id}/refresh`, "PUT")
  }

  async refreshAllFeeds(): Promise<Result<void>> {
    return this.request<void>("/v1/feeds/refresh", "PUT")
  }

  async removeFeed(feed_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/feeds/${feed_id}`, "DELETE")
  }

  async markFeedEntriesAsRead(feed_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/feeds/${feed_id}/mark-all-as-read`, "PUT")
  }

  async getCounters(): Promise<Result<Counters>> {
    return this.request<Counters>("/v1/feeds/counters")
  }

  // Entries

  async getEntry(entry_id: number): Promise<Result<Entry>> {
    return this.request<Entry>(`/v1/entries/${entry_id}`)
  }

  async getFeedEntry(feed_id: number, entry_id: number): Promise<Result<Entry>> {
    return this.request<Entry>(`/v1/feeds/${feed_id}/entries/${entry_id}`)
  }

  async getEntries(filter?: EntryFilter): Promise<Result<EntryResultSet>> {
    return this.request<EntryResultSet>(`/v1/entries${this.buildQuery(filter ?? {})}`)
  }

  async getFeedEntries(feed_id: number, filter?: EntryFilter): Promise<Result<EntryResultSet>> {
    return this.request<EntryResultSet>(`/v1/feeds/${feed_id}/entries${this.buildQuery(filter ?? {})}`)
  }

  async getCategoryEntries(category_id: number, filter?: EntryFilter): Promise<Result<EntryResultSet>> {
    return this.request<EntryResultSet>(`/v1/categories/${category_id}/entries${this.buildQuery(filter ?? {})}`)
  }

  async updateEntry(entry_id: number, req: UpdateEntryRequest): Promise<Result<Entry>> {
    return this.request<Entry>(`/v1/entries/${entry_id}`, "PUT", req)
  }

  async updateEntries(entry_ids: number[], status: EntryStatus): Promise<Result<void>> {
    return this.request<void>("/v1/entries", "PUT", { entry_ids, status })
  }

  async toggleEntryBookmark(entry_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/entries/${entry_id}/bookmark`, "PUT")
  }

  async saveEntry(entry_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/entries/${entry_id}/save`, "POST")
  }

  async fetchEntryContent(entry_id: number, update_content: boolean = false): Promise<Result<{ content: string }>> {
    return this.request<{ content: string }>(`/v1/entries/${entry_id}/fetch-content${this.buildQuery({ update_content })}`)
  }

  async markUserEntriesAsRead(user_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/users/${user_id}/mark-all-as-read`, "PUT")
  }

  // Categories

  async getCategories(counts: boolean = false): Promise<Result<Category[]>> {
    return this.request<Category[]>(`/v1/categories${this.buildQuery({ counts: counts || undefined })}`)
  }

  async createCategory(title: string, hide_globally: boolean = false): Promise<Result<Category>> {
    return this.request<Category>("/v1/categories", "POST", { title, hide_globally })
  }

  async updateCategory(category_id: number, title?: string, hide_globally?: boolean): Promise<Result<Category>> {
    return this.request<Category>(`/v1/categories/${category_id}`, "PUT", { title, hide_globally })
  }

  async deleteCategory(category_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/categories/${category_id}`, "DELETE")
  }

  async refreshCategoryFeeds(category_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/categories/${category_id}/refresh`, "PUT")
  }

  async markCategoryEntriesAsRead(category_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/categories/${category_id}/mark-all-as-read`, "PUT")
  }

  // Users

  async getCurrentUser(): Promise<Result<User>> {
    return this.request<User>("/v1/me")
  }

  async getUsers(): Promise<Result<User[]>> {
    return this.request<User[]>("/v1/users")
  }

  async getUser(user_id_or_username: number | string): Promise<Result<User>> {
    return this.request<User>(`/v1/users/${user_id_or_username}`)
  }

  async createUser(req: CreateUserRequest): Promise<Result<User>> {
    return this.request<User>("/v1/users", "POST", req)
  }

  async updateUser(user_id: number, req: UpdateUserRequest): Promise<Result<User>> {
    return this.request<User>(`/v1/users/${user_id}`, "PUT", req)
  }

  async deleteUser(user_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/users/${user_id}`, "DELETE")
  }

  // Enclosures

  async getEnclosure(enclosure_id: number): Promise<Result<Enclosure>> {
    return this.request<Enclosure>(`/v1/enclosures/${enclosure_id}`)
  }

  async updateEnclosure(enclosure_id: number, media_progression: number): Promise<Result<void>> {
    return this.request<void>(`/v1/enclosures/${enclosure_id}`, "PUT", { media_progression })
  }

  // Misc

  async discover(url: string): Promise<Result<Subscription[]>> {
    return this.request<Subscription[]>("/v1/discover", "POST", { url })
  }

  async exportOPML(): Promise<Result<string>> {
    return this.requestText("/v1/export")
  }

  async importOPML(opml: string): Promise<Result<{ message: string }>> {
    return this.requestText("/v1/import", "POST", opml) as Promise<Result<{ message: string }>>
  }

  async flushHistory(): Promise<Result<void>> {
    return this.request<void>("/v1/flush-history", "PUT")
  }

  async version(): Promise<Result<VersionInfo>> {
    return this.request<VersionInfo>("/v1/version")
  }

  async getApiKeys(): Promise<Result<ApiKey[]>> {
    return this.request<ApiKey[]>("/v1/api-keys")
  }

  async createApiKey(description: string): Promise<Result<ApiKey>> {
    return this.request<ApiKey>("/v1/api-keys", "POST", { description })
  }

  async deleteApiKey(api_key_id: number): Promise<Result<void>> {
    return this.request<void>(`/v1/api-keys/${api_key_id}`, "DELETE")
  }
}

// ---- Types & Interfaces ----

interface ApiError {
  error_message: string
}

type Result<T> =
  | { ok: true, data: T }
  | { ok: false, error: ApiError }

type EntryStatus = "read" | "unread" | "removed"

export interface Feed {
  id: number
  user_id: number
  title: string
  site_url: string
  feed_url: string
  checked_at: string
  etag_header: string
  last_modified_header: string
  parsing_error_message: string
  parsing_error_count: number
  scraper_rules: string
  rewrite_rules: string
  crawler: boolean
  blocklist_rules: string
  keeplist_rules: string
  user_agent: string
  username: string
  password: string
  disabled: boolean
  ignore_http_cache: boolean
  fetch_via_proxy: boolean
  category: {
    id: number
    user_id: number
    title: string
  }
  icon: {
    feed_id: number
    icon_id: number
  } | null
}

export interface FeedIcon {
  id: number
  data: string
  mime_type: string
}

interface Enclosure {
  id: number
  user_id: number
  entry_id: number
  url: string
  mime_type: string
  size: number
  media_progression: number
}

export interface Entry {
  id: number
  user_id: number
  feed_id: number
  title: string
  url: string
  comments_url: string
  author: string
  content: string
  hash: string
  published_at: string
  created_at: string
  status: EntryStatus
  share_code: string
  starred: boolean
  reading_time: number
  enclosures: Enclosure[] | null
  feed: Feed
}

interface EntryResultSet {
  total: number
  entries: Entry[]
}

export interface EntryFilter {
  status?: EntryStatus | EntryStatus[]
  offset?: number
  limit?: number
  order?: "id" | "status" | "published_at" | "category_title" | "category_id"
  direction?: "asc" | "desc"
  before?: number
  after?: number
  published_before?: number
  published_after?: number
  changed_before?: number
  changed_after?: number
  before_entry_id?: number
  after_entry_id?: number
  starred?: boolean
  search?: string
  category_id?: number
  globally_visible?: boolean
}

export interface Category {
  id: number
  user_id: number
  title: string
  hide_globally: boolean
  feed_count?: number
  total_unread?: number
}

interface User {
  id: number
  username: string
  is_admin: boolean
  theme: string
  language: string
  timezone: string
  entry_sorting_direction: string
  stylesheet: string
  google_id: string
  openid_connect_id: string
  entries_per_page: number
  keyboard_shortcuts: boolean
  show_reading_time: boolean
  entry_swipe: boolean
  last_login_at: string | null
}

interface Subscription {
  url: string
  title: string
  type: string
}

export interface Counters {
  reads: Record<string, number>
  unreads: Record<string, number>
}

interface VersionInfo {
  version: string
  commit: string
  build_date: string
  go_version: string
  compiler: string
  arch: string
  os: string
}

interface ApiKey {
  id: number
  user_id: number
  description: string
  token: string
  created_at: string
  last_used_at: string
}

interface CreateFeedRequest {
  feed_url: string
  category_id?: number
  username?: string
  password?: string
  crawler?: boolean
  user_agent?: string
  scraper_rules?: string
  rewrite_rules?: string
  blocklist_rules?: string
  keeplist_rules?: string
  disabled?: boolean
  ignore_http_cache?: boolean
  fetch_via_proxy?: boolean
}

interface UpdateFeedRequest {
  feed_url?: string
  site_url?: string
  title?: string
  category_id?: number
  username?: string
  password?: string
  crawler?: boolean
  user_agent?: string
  scraper_rules?: string
  rewrite_rules?: string
  blocklist_rules?: string
  keeplist_rules?: string
  disabled?: boolean
  ignore_http_cache?: boolean
  fetch_via_proxy?: boolean
}

export interface UpdateEntryRequest {
  title?: string
  content?: string
}

interface CreateUserRequest {
  username: string
  password: string
  is_admin?: boolean
  google_id?: string
  openid_connect_id?: string
}

interface UpdateUserRequest {
  username?: string
  password?: string
  theme?: string
  language?: string
  timezone?: string
  entry_sorting_direction?: "asc" | "desc"
  stylesheet?: string
  google_id?: string
  openid_connect_id?: string
  entries_per_page?: number
  is_admin?: boolean
  keyboard_shortcuts?: boolean
  show_reading_time?: boolean
  entry_swipe?: boolean
}
