import { AppComponent } from "next/dist/shared/lib/router/router";
import Link from "next/link"
import * as React from "react"

const get_auth = (cookie: string) => decodeURIComponent(cookie)
  .split(`;`)
  .map(pair => pair.trim())
  .find(pair => pair.startsWith(`auth=`))
  ?.slice(5)

const App: AppComponent = ({ Component, pageProps }) => {
  const [auth, set_auth] = React.useState<Record<`id` | `name`, string>>()

  React.useEffect(() => {
    const auth_json = get_auth(document.cookie)
    if (auth_json) {
      set_auth(JSON.parse(auth_json))
    }
  }, [])

  return (
  <div>
    <section>
      <h2>Where you wanna go</h2>
      <nav style={{ display: `flex`, gap: `1rem` }}>
        <Link href="/users">I wanna see them users</Link>
        <Link href="/posts">Show me them posts</Link>
        {
          auth
            ? <Link href={`/users/${auth.id}`}>Logged in as {auth.name}</Link>
            : <Link href="/users">Log in</Link>
        }
      </nav>
    </section>
    <main>
      <Component {...pageProps} />
    </main>
  </div>
)
}

export default App
