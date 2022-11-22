import * as p from "@prisma/client"
import { InferGetServerSidePropsType } from "next"
import Link from "next/link"

const prisma = new p.PrismaClient()

export const getServerSideProps = async () => {
  await prisma.$connect()

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          followers: true,
          posts: true,
        },
      },
    },
  })

  await prisma.$disconnect()

  return {
    props: {
      users,
    },
  }
}

type Props = InferGetServerSidePropsType<typeof getServerSideProps>

const UsersPage: React.FC<Props> = ({ users }) => (
  <ul>
    {users.map((u) => (
      <li key={u.id}>
        <span>
          {u.name} | {u.email} | {u._count.followers} followers |{" "}
          {u._count.posts} posts
        </span>{" "}
        <Link href={`/api/auth?user_id=${u.id}`}>Log in as this user</Link>
      </li>
    ))}
  </ul>
)

export default UsersPage
