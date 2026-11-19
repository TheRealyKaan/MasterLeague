import { Team } from '@/views/League.jsx'

export const metadata = { title: 'Takım' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Team id={decodeURIComponent(id)} />
}
