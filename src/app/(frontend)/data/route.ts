import { getLeague } from '@/server/league'

export const dynamic = 'force-dynamic'

/** Light JSON snapshot the site polls for live scores (serverless-friendly, no sockets). */
export async function GET() {
  return Response.json(await getLeague(), { headers: { 'Cache-Control': 'no-store' } })
}
