import * as p from "@prisma/client"
import { faker } from "@faker-js/faker"
import * as uuid from "uuid"

const prisma = new p.PrismaClient()
const rand_int = (min: number, max: number) => faker.datatype.number({ min, max: max - 1 }) | 0

type CreateComment = Readonly<{
  published: boolean
  content: string
  authorId: string
  postId: string
  parentId: string | null
  id: string,
  replies: readonly CreateComment[]
}>

const gen_comments = (
  post_id: string,
  parent_id: string | null,
  author_ids: readonly string[],
  max: number
): CreateComment[]  => {
  const length = faker.datatype.number({ max })

  const comments = Array.from({ length }, () => {
    const id = uuid.v4()
    return {
      postId: post_id,
      published: true,
      content: faker.lorem.text(),
      authorId: author_ids[rand_int(0, author_ids.length)],
      parentId: parent_id,
      id,
      replies: gen_comments(post_id, id, author_ids, length >> 1)
    }
  })

  return comments
}

type CommentBatch = Readonly<{ data: Omit<CreateComment, `replies`>[]; next: readonly CreateComment[] }>

const create_comments = async (comments: readonly CreateComment[]): Promise<void> => {
  if (comments.length === 0) return
  const { data, next } = comments.reduce(
    ({ data, next }, { replies, ...rest }) => ({
      data: [...data, rest],
      next: [...next, ...replies]
    }),
    { data: [], next: [] } as CommentBatch
  )

  console.log(await prisma.comment.createMany({ data }))
  return create_comments(next)
}

const create_users = async () => {
  console.log(await prisma.user.createMany({
    data: Array.from(
      { length: 30 },
      () => ({
        email: faker.internet.email(),
        name: faker.name.fullName(),
      })
    ),
    skipDuplicates: true
  }))

  const user_ids = (await prisma.user.findMany({
    select: {
      id: true
    }
  })).map(u => u.id)

  return user_ids
}

const create_posts = async (user_ids: readonly string[]) => {
  const data = user_ids.flatMap(
    authorId => Array.from({ length: rand_int(5, 15) }, () => ({
      title: `${faker.random.word()} ${faker.science.chemicalElement().name}`,
      content: faker.lorem.text(),
      published: true,
      authorId
    }))
  )

  console.log(await prisma.post.createMany({ data }))

  const post_ids = await prisma.post.findMany({
    select: {
      id: true
    }
  })

  return post_ids.map(p => p.id)
}

const main = async () => {
  const user_ids = await create_users()
  const post_ids = await create_posts(user_ids)

  const comments = post_ids.flatMap(post_id => gen_comments(post_id, null, user_ids, rand_int(5, 10)))
  await create_comments(comments)
}

prisma
  .$connect()
  .then(main)
  .then(() => prisma.$disconnect())
  .catch(() => prisma.$disconnect())
