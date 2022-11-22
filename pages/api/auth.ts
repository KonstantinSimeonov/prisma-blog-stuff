import { NextApiHandler } from "next";
import * as p from "@prisma/client"
import { setCookie } from "cookies-next"
const prisma = new p.PrismaClient()

const authenticate: NextApiHandler = async (req, res) => {
  const id = req.query.user_id

  if (!id || typeof id !== `string`) {
    res
      .status(400)
      .setHeader(`Content-Type`, `text/html`)
      .send(`<h1>dont send me bad ids</h1>`)
    return
  }

  await prisma.$connect()

  const user = await prisma.user.findUnique({
    where: {
      id
    }
  })

  if (user) {
    const { name, id } = user
    setCookie(`auth`, JSON.stringify({ name, id }), { req, res })
    res
      .redirect(`/users`)
      .end()
  }

  await prisma.$disconnect()
}

export default authenticate
