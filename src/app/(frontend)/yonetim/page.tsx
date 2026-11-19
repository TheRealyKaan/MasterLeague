import { redirect } from 'next/navigation'
import { currentUser } from '@/server/league'
import { Admin } from '@/views/Control.jsx'

export const metadata = { title: 'Yönetim' }

export default async function Page() {
  if ((await currentUser())?.role !== 'admin') redirect('/giris')
  return <Admin />
}
