import { useState } from "react"
import { useNavigate } from "react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { MinifluxClient, AuthMode } from "~/lib/miniflux/client"
import { useMiniflux } from "~/lib/miniflux/context"

function Login() {
  const [tokenMode, settokenMode] = useState(false)
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setClient } = useMiniflux()
  const navigate = useNavigate()

  const login = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const client = new MinifluxClient(
        tokenMode ? AuthMode.TokenAuth : AuthMode.BasicAuth,
        url,
        tokenMode ? undefined : username,
        tokenMode ? undefined : password,
        tokenMode ? token : undefined,
      )
      const result = await client.getCurrentUser()
      if (!result.ok) {
        setError(result.error.error_message)
        return
      }
      setClient(client)
      navigate("/")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen justify-center items-center bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your credentials below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={login}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="url">URL</Label>
                  {tokenMode ?
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      onClick={() => settokenMode(!tokenMode)}
                    >
                      Toggle Basic Auth
                    </a> :
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      onClick={() => settokenMode(!tokenMode)}
                    >
                      Toggle Token Auth
                    </a>}
                </div>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.org"
                  autoComplete="on"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required />
              </div>
              {tokenMode ?
                <TokenInput token={token} tokenOnChange={(e) => setToken(e.target.value)} /> :
                <EmailPasswordInput
                  username={username} password={password}
                  usernameOnChange={(e) => setUsername(e.target.value)} passwordOnChange={(e) => setPassword(e.target.value)}
                />}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          {error && <p className="text-sm text-destructive w-full">{error}</p>}
          <Button type="submit" form="login-form" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


function EmailPasswordInput(props: {
  username: string,
  password: string,
  usernameOnChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
  passwordOnChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="miniflux"
          autoComplete="on"
          value={props.username}
          onChange={props.usernameOnChange}
          required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="on"
          value={props.password}
          onChange={props.passwordOnChange}
          required />
      </div>
    </div>
  )
}

function TokenInput(props: {
  token: string,
  tokenOnChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <div className="grid gap-2">
        <Label htmlFor="token">Token</Label>
        <Input
          id="token"
          type="text"
          value={props.token}
          onChange={props.tokenOnChange}
          required
        />
      </div>
    </div>
  )
}
export default Login;