import * as p from "@prisma/client"
import * as React from "react"
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next"
import Link from "next/link"
import { get_pagination_params } from "../pagination"
import { css } from "../style"

const prisma = new p.PrismaClient()

const get_order = (context: GetServerSidePropsContext) => {
  const { order } = context.query

  switch (order) {
    case `most-likes`:
      return {
        PostLike: {
          _count: `desc`,
        },
      } as const

    case `most-comments`:
      return {
        comments: {
          _count: `desc`,
        },
      } as const

    case `most-recent`:
    default:
      return {
        createdAt: `desc`,
      } as const
  }
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  await prisma.$connect()

  const { skip, take } = get_pagination_params(context)

  console.log({ skip, take })
  const posts = await prisma.post.findMany({
    orderBy: get_order(context),
    skip,
    take,
    include: {
      _count: {
        select: {
          PostLike: true,
        },
      },
      comments: {
        include: {
          author: true,
        },
      },
      author: {
        select: {
          name: true,
        },
      },
    },
  })

  await prisma.$disconnect()

  return {
    props: {
      posts: posts.map(({ createdAt, ...p }) => ({
        createdAt: createdAt.toISOString(),
        ...p,
      })),
    },
  }
}

type Props = InferGetServerSidePropsType<typeof getServerSideProps>

const SearchInput: React.FC = () => {
  return (
    <div>
      <h2>Search posts</h2>
      <form
        action="/posts"
        method="GET"
        style={css`
          display: flex;
          gap: 1rem;
          align-items: end;
        `}
      >
        <label>
          <p>Page</p>
          <input
            name="page"
            type="number"
            defaultValue={1}
            placeholder="Page"
          />
        </label>
        <label>
          <p>Posts per page</p>
          <input
            name="page_size"
            type="number"
            defaultValue={10}
            placeholder="Posts per page"
          />
        </label>
        <label>
          <p>Show first posts with</p>
          <select name="order" placeholder="Order by">
            <option value="most-likes">most likes</option>
            <option value="most-comments">most comments</option>
            <option value="most-recent">most recent</option>
          </select>
        </label>
        <button type="submit">Search</button>
      </form>
    </div>
  )
}

const AuthorLink: React.FC<{ author: Record<`name` | `id`, string> }> = ({
  author,
}) => (
  <Link
    style={css`
      font-style: italic;
    `}
    href={`/users/${author.id}`}
  >
    {author.name}
  </Link>
)

const PostDate: React.FC<{ iso: string }> = ({ iso }) => (
  <time>
    {new Date(iso).toLocaleString(`en`, {
      year: `numeric`,
      month: `short`,
      day: `numeric`,
    })}
  </time>
)

const Posts: React.FC<Props> = ({ posts }) => (
  <div>
    <SearchInput />
    <ul>
      {posts.map((p) => (
        <li key={p.id}>
          <article>
            <header
              style={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
              `}
            >
              <h2>{p.title}</h2>
              <PostDate iso={p.createdAt} />
              <span>
                by <AuthorLink author={p.author} />
              </span>
              <span>{p._count.PostLike} likes</span>
            </header>
            <p>{p.content}</p>
            <section>
              <h3>Comments</h3>
              <Comments tree={build_comment_tree(p.comments)} />
            </section>
          </article>
        </li>
      ))}
    </ul>
  </div>
)

type CommentWithReplies = p.Comment & { author: p.User } & {
  replies: CommentWithReplies[]
}

const build_comment_tree = (
  comments: readonly (p.Comment & { author: p.User })[]
) => {
  const by_id: Record<string, CommentWithReplies> = Object.fromEntries(
    comments.map((c) => [c.id, { ...c, replies: [] }])
  )

  for (const c of Object.values(by_id)) {
    by_id[String(c.parentId)]?.replies.push(c)
  }

  return Object.values(by_id)
}

const Comments: React.FC<{ tree: CommentWithReplies[] }> = ({ tree }) => (
  <ul
    style={css`
      position: relative;
      list-style: none;
    `}
  >
    <span
      style={css`
        position: absolute;
        height: calc(100% + 0.9rem);
        border: 1px solid black;
        top: -1.6rem;
        left: -0.6rem;
      `}
    />
    {tree.map((c) => (
      <li
        key={c.id}
        style={css`
          position: relative;
        `}
      >
        <span
          style={css`
            border: 1px solid black;
            position: absolute;
            width: 2.4rem;
            top: 0.5rem;
            left: -3rem;
          `}
        />
        <p>
          <AuthorLink author={c.author} />: {c.content}
        </p>
        {c.replies.length ? <Comments tree={c.replies} /> : null}
      </li>
    ))}
  </ul>
)

export default Posts
