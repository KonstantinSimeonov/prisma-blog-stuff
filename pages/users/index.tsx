import * as p from "@prisma/client"
import { GetServerSideProps } from "next"

const prisma = new p.PrismaClient()

type Props = {
  users: readonly (Omit<p.User, `followers`> & { followers: number })[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  await prisma.$connect()

  const users = (await prisma.user.findMany({
    include: {
      followers: true
    }
  })).map(({ followers, ...rest }) => ({ ...rest, followers: followers.length }))

  await prisma.$disconnect()

  return {
    props: {
      users
    }
  }
}

const UsersPage: React.FC<Props> = ({ users }) => (
  <ul>
    {users.map(u => (
      <li key={u.id}>
        {u.name} | {u.email} | {u.followers} followers
      </li>
    ))}
  </ul>
)

export default UsersPage
