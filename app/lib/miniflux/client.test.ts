import { describe, it, expect, vi, beforeEach } from "vitest"
import { MinifluxClient, AuthMode } from "./client"

// ---- helpers ----

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(
      status === 204 ? null : JSON.stringify(body),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    )
  )
}

function mockTextResponse(text: string, status = 200) {
  return Promise.resolve(new Response(text, { status }))
}

function lastRequest(): Request {
  const calls = vi.mocked(fetch).mock.calls
  return calls[calls.length - 1][0] as Request
}

// ---- setup ----

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
})

// ---- constructor ----

describe("constructor", () => {
  it("throws when url is empty", () => {
    expect(() => new MinifluxClient(AuthMode.TokenAuth, "", undefined, undefined, "token")).toThrow("empty url")
  })

  it("throws when no credentials are provided", () => {
    expect(() => new MinifluxClient(AuthMode.TokenAuth, "http://localhost")).toThrow("invalid credential")
  })

  it("accepts token auth", () => {
    expect(() => new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "mytoken")).not.toThrow()
  })

  it("accepts basic auth", () => {
    expect(() => new MinifluxClient(AuthMode.BasicAuth, "http://localhost", "user", "pass")).not.toThrow()
  })
})

// ---- authentication headers ----

describe("authentication", () => {
  it("sets X-Auth-Token header for token auth", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse([]))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "secret")
    await client.getFeeds()
    const req = lastRequest()
    expect(req.headers.get("X-Auth-Token")).toBe("secret")
    expect(req.headers.get("Authorization")).toBeNull()
  })

  it("sets Authorization header for basic auth", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse([]))
    const client = new MinifluxClient(AuthMode.BasicAuth, "http://localhost", "user", "pass")
    await client.getFeeds()
    const req = lastRequest()
    expect(req.headers.get("Authorization")).toBe("Basic " + btoa("user:pass"))
    expect(req.headers.get("X-Auth-Token")).toBeNull()
  })
})

// ---- feeds ----

describe("getFeeds", () => {
  it("returns feed list on success", async () => {
    const feeds = [{ id: 1, title: "Feed A" }]
    vi.mocked(fetch).mockReturnValue(mockResponse(feeds))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.getFeeds()
    expect(result).toEqual({ ok: true, data: feeds })
    expect(lastRequest().url).toBe("http://localhost/v1/feeds")
  })

  it("returns error on failure", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ error_message: "unauthorized" }, 401))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.getFeeds()
    expect(result).toEqual({ ok: false, error: { error_message: "unauthorized" } })
  })
})

describe("createFeed", () => {
  it("sends POST with feed_url and returns feed_id", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ feed_id: 42 }, 201))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.createFeed("http://example.org/feed.xml", 10)
    expect(result).toEqual({ ok: true, data: 42 })
    const req = lastRequest()
    expect(req.method).toBe("POST")
    const body = await req.json()
    expect(body).toMatchObject({ feed_url: "http://example.org/feed.xml", category_id: 10 })
  })
})

describe("updateFeed", () => {
  it("sends PUT to correct URL", async () => {
    const feed = { id: 5, title: "Updated" }
    vi.mocked(fetch).mockReturnValue(mockResponse(feed))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.updateFeed(5, { title: "Updated" })
    const req = lastRequest()
    expect(req.method).toBe("PUT")
    expect(req.url).toBe("http://localhost/v1/feeds/5")
  })
})

describe("removeFeed", () => {
  it("sends DELETE and returns ok:true for 204", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse(null, 204))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.removeFeed(7)
    expect(result.ok).toBe(true)
    expect(lastRequest().method).toBe("DELETE")
  })
})

describe("refreshFeed", () => {
  it("returns ok:true on 204", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse(null, 204))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.refreshFeed(3)
    expect(result.ok).toBe(true)
    expect(lastRequest().url).toBe("http://localhost/v1/feeds/3/refresh")
  })
})

// ---- entries ----

describe("getEntries", () => {
  it("fetches /v1/entries without filter", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ total: 0, entries: [] }))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.getEntries()
    expect(lastRequest().url).toBe("http://localhost/v1/entries")
  })

  it("serializes scalar filters into query string", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ total: 0, entries: [] }))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.getEntries({ limit: 10, direction: "asc", starred: true })
    const url = new URL(lastRequest().url)
    expect(url.searchParams.get("limit")).toBe("10")
    expect(url.searchParams.get("direction")).toBe("asc")
    expect(url.searchParams.get("starred")).toBe("true")
  })

  it("repeats status param for array values", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ total: 0, entries: [] }))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.getEntries({ status: ["read", "unread"] })
    const url = new URL(lastRequest().url)
    expect(url.searchParams.getAll("status")).toEqual(["read", "unread"])
  })
})

describe("updateEntries", () => {
  it("sends PUT with entry_ids and status", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse(null, 204))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.updateEntries([1, 2, 3], "read")
    const req = lastRequest()
    expect(req.method).toBe("PUT")
    const body = await req.json()
    expect(body).toEqual({ entry_ids: [1, 2, 3], status: "read" })
  })
})

describe("toggleEntryBookmark", () => {
  it("sends PUT to bookmark endpoint", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse(null, 204))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.toggleEntryBookmark(99)
    const req = lastRequest()
    expect(req.method).toBe("PUT")
    expect(req.url).toBe("http://localhost/v1/entries/99/bookmark")
  })
})

// ---- categories ----

describe("getCategories", () => {
  it("fetches without counts by default", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse([]))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.getCategories()
    expect(lastRequest().url).toBe("http://localhost/v1/categories")
  })

  it("appends counts=true when requested", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse([]))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.getCategories(true)
    const url = new URL(lastRequest().url)
    expect(url.searchParams.get("counts")).toBe("true")
  })
})

describe("deleteCategory", () => {
  it("sends DELETE to correct URL", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse(null, 204))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    await client.deleteCategory(5)
    const req = lastRequest()
    expect(req.method).toBe("DELETE")
    expect(req.url).toBe("http://localhost/v1/categories/5")
  })
})

// ---- users ----

describe("getCurrentUser", () => {
  it("fetches /v1/me", async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, username: "admin" }))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.getCurrentUser()
    expect(result.ok).toBe(true)
    expect(lastRequest().url).toBe("http://localhost/v1/me")
  })
})

// ---- misc ----

describe("exportOPML", () => {
  it("returns XML string", async () => {
    const xml = `<?xml version="1.0"?><opml></opml>`
    vi.mocked(fetch).mockReturnValue(mockTextResponse(xml))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.exportOPML()
    expect(result).toEqual({ ok: true, data: xml })
  })
})

describe("discover", () => {
  it("sends POST with url", async () => {
    const subs = [{ url: "http://example.org/feed.xml", title: "Example", type: "rss" }]
    vi.mocked(fetch).mockReturnValue(mockResponse(subs))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.discover("http://example.org")
    expect(result).toEqual({ ok: true, data: subs })
    const req = lastRequest()
    expect(req.method).toBe("POST")
    const body = await req.json()
    expect(body).toEqual({ url: "http://example.org" })
  })
})

describe("version", () => {
  it("fetches /v1/version", async () => {
    const v = { version: "2.0.49", commit: "abc", build_date: "", go_version: "", compiler: "", arch: "", os: "" }
    vi.mocked(fetch).mockReturnValue(mockResponse(v))
    const client = new MinifluxClient(AuthMode.TokenAuth, "http://localhost", undefined, undefined, "t")
    const result = await client.version()
    expect(result).toEqual({ ok: true, data: v })
  })
})
