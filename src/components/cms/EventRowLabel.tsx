'use client'
import { useRowLabel } from '@payloadcms/ui'

const KIND: Record<string, string> = { G: 'Gol', OG: 'Kendi kalesine', Y: 'Sarı kart', R: 'Kırmızı kart' }

/** CMS row title for a match event: "26’ Gol · Emir Tan (Ev sahibi)" */
export function EventRowLabel() {
  const { data } = useRowLabel<{ kind?: string; player?: string; minute?: number; side?: string }>()
  const side = data?.side === 'away' ? 'Deplasman' : 'Ev sahibi'
  return (
    <span>
      {data?.minute != null ? `${data.minute}’ ` : ''}
      {KIND[data?.kind || ''] || 'Olay'}
      {data?.player ? ` · ${data.player}` : ''} ({side})
    </span>
  )
}
