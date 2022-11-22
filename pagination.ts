import { GetServerSidePropsContext } from "next"

const clamp = (low: number, high: number, x: unknown) =>
  Math.min(high, Math.max(low, parseInt(String(x), 10) || 0))

export const get_pagination_params = (context: GetServerSidePropsContext) => {
  const page = clamp(0, Infinity, context.query.page)
  const page_size = clamp(0, 20, context.query.page_size) || 10
  const skip = clamp(0, Infinity, (page - 1) * page_size)
  return { skip, take: page_size }
}
