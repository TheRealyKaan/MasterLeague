import { redirect } from 'next/navigation'
import { currentUser } from '@/server/league'
import { Referee } from '@/views/Control.jsx'

export const metadata = { title: 'Hakem paneli' }

export default async function Page({ params }: { params: Promise<{ id?: string[] }> }) {
  const user = await currentUser()
  // referees work only on the match they picked; they choose it on the login page
  if (!user || (user.role === 'referee' && !user.assignedMatch)) redirect('/giris')
  const { id } = await params
  return <Referee id={id?.[0]} />
}
