import * as p from "@prisma/client"
import { InferGetServerSidePropsType } from "next"

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
        {u.name} | {u.email} | {u._count.followers} followers | {u._count.posts}{" "}
        posts
      </li>
    ))}
  </ul>
)

export default UsersPage
