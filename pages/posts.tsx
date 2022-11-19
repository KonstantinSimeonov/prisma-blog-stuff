import * as p from "@prisma/client"
import { InferGetServerSidePropsType } from "next"

const prisma = new p.PrismaClient()

export const getServerSideProps = async () => {
  await prisma.$connect()

  const posts = await prisma.post.findMany({
    take: 10,
    include: {
      _count: {
        select: {
          PostLike: true
        }
      },
      comments: true
    }
  })

  await prisma.$disconnect()

  return {
    props: {
      posts
    }
  }
}

const Posts: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> =
  ({ posts }) => (
    <ul>
      {posts.map(p => (
        <li key={p.id}>
          <article>
            <header>
              <h2>{p.title}</h2>
              {p._count.PostLike} likes
            </header>
            <p>{p.content}</p>
            <section>
              <h3>Comments</h3>
              {p.comments.map(c => c.content).join(`\n`)}
            </section>
          </article>
        </li>
      ))}
    </ul>
  )

export default Posts
