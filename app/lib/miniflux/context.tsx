import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { MinifluxClient, AuthMode } from "./client"

const STORAGE_KEY = "miniflux_credentials"

interface StoredCredentials {
  url: string
  authMode: AuthMode
  username?: string
  password?: string
  token?: string
}

interface MinifluxContextValue {
  client: MinifluxClient | null
  setClient: (client: MinifluxClient) => void
  clearClient: () => void
}

const MinifluxContext = createContext<MinifluxContextValue | null>(null)

function saveCredentials(client: MinifluxClient) {
  const credentials: StoredCredentials = {
    url: client.url,
    authMode: client.authMode,
    username: client.username,
    password: client.password,
    token: client.token,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

function loadCredentials(): MinifluxClient | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { url, authMode, username, password, token } = JSON.parse(raw) as StoredCredentials
    return new MinifluxClient(authMode, url, username, password, token)
  } catch {
    return null
  }
}

export function MinifluxProvider({ children }: { children: ReactNode }) {
  const [client, setClientState] = useState<MinifluxClient | null>(null)

  useEffect(() => {
    setClientState(loadCredentials())
  }, [])

  function setClient(client: MinifluxClient) {
    saveCredentials(client)
    setClientState(client)
  }

  function clearClient() {
    localStorage.removeItem(STORAGE_KEY)
    setClientState(null)
  }

  return (
    <MinifluxContext.Provider value={{ client, setClient, clearClient }}>
      {children}
    </MinifluxContext.Provider>
  )
}

export function useMiniflux(): MinifluxContextValue {
  const ctx = useContext(MinifluxContext)
  if (!ctx) throw new Error("useMiniflux must be used within MinifluxProvider")
  return ctx
}
