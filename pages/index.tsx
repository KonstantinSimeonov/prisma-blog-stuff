import Link from "next/link"

const Home = () => (
  <div>
    <h1>Here be blog site</h1>
    <section>
      <h2>Where you wanna go</h2>
      <nav style={{ display: `flex`, gap: `1rem` }}>
        <Link href="/users">I wanna see them users</Link>
        <Link href="/posts">Show me them posts</Link>
      </nav>
    </section>
  </div>
)

export default Home
