import { Match } from '@/views/League.jsx'

export const metadata = { title: 'Maç detayı' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Match id={decodeURIComponent(id)} />
}
