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

const create_comments = async (comments: readonly CreateComment[]): Promise<void> => {
  console.log(`Comments...`)
  type CommentBatch = { data: Omit<CreateComment, `replies`>[]; next: CreateComment[] }

  if (comments.length === 0) return
  const { data, next } = comments.reduce<CommentBatch>(
    ({ data, next }, { replies, ...rest }) => ({
      data: [...data, rest],
      next: [...next, ...replies]
    }),
    { data: [], next: [] }
  )

  console.log(await prisma.comment.createMany({ data }))
  return create_comments(next)
}

const create_users = async () => {
  console.log(`Users...`)
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

const arbitrary_subset = <T>(xs: readonly T[], max = xs.length): T[] => {
  const keep = new Set(Array.from({ length: rand_int(0, max) }, () => rand_int(0, xs.length)))
  return xs.filter((_, i) => keep.has(i))
}

const create_posts = async (user_ids: readonly string[]) => {
  console.log(`Posts...`)
  const data = user_ids.flatMap(
    authorId => Array.from({ length: rand_int(5, 15) }, () => ({
        title: `${faker.random.word()} ${faker.science.chemicalElement().name}`,
        content: faker.lorem.text(),
        published: true,
        authorId,
      })
    )
  )

  console.log(await prisma.post.createMany({ data }))

  const post_ids = await prisma.post.findMany({
    select: {
      id: true
    }
  })

  return post_ids.map(p => p.id)
}

const create_follows = async (user_ids: readonly string[]) => {
  console.log(`Follows...`)
  const data = user_ids.flatMap(id => {
    const follows_for_id = arbitrary_subset(user_ids)
      .filter(id_to_follow => id_to_follow !== id)
      .map(follower_id => ({ followerId: follower_id, followingId: id }))

    return follows_for_id
  })

  console.log(await prisma.follows.createMany({
    data
  }))
}

const create_post_likes = async (user_ids: readonly string[], post_ids: readonly string[]) => {
  console.log(`Post likes...`)
  const likes = post_ids.flatMap(
    postId => arbitrary_subset(user_ids).map(userId => ({ postId, userId }))
  )

  console.log(await prisma.postLike.createMany({ data: likes }))
}

const create_comment_likes = async (user_ids: readonly string[], comment_ids: readonly string[]) => {
  console.log(`Comment likes...`)
  const comment_likes = arbitrary_subset(comment_ids, comment_ids.length >> 2)
    .flatMap(commentId => arbitrary_subset(user_ids).map(userId => ({ commentId, userId })))

  console.log(await prisma.commentLike.createMany({ data: comment_likes }))
}

const main = async () => {
  const user_ids = await create_users()
  await create_follows(user_ids)

  const post_ids = await create_posts(user_ids)
  await create_post_likes(user_ids, post_ids)


  const comments = post_ids.flatMap(post_id => gen_comments(post_id, null, user_ids, rand_int(5, 10)))
  await create_comments(comments)
  await create_comment_likes(user_ids, comments.map(c => c.id))
}

prisma
  .$connect()
  .then(main)
  .then(() => prisma.$disconnect())
  .catch(() => prisma.$disconnect())
