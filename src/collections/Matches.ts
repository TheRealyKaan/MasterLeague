import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number | string }).id : (v as number | string | undefined))

export const Matches: CollectionConfig = {
  slug: 'matches',
  labels: { singular: 'Maç', plural: 'Maçlar' },
  defaultSort: 'kickoff',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'kickoff', 'status', 'stage', 'pitch'], group: 'Lig' },
  // public read; all writes go through admins here, or through validated server actions for referees
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const home = idOf(data.home ?? originalDoc?.home), away = idOf(data.away ?? originalDoc?.away)
        const name = async (id: unknown) =>
          id ? (await req.payload.findByID({ collection: 'teams', id: id as number, req, depth: 0, overrideAccess: true }).catch(() => null))?.name : ''
        data.title = `${(await name(home)) || '?'} - ${(await name(away)) || '?'}`
        // clock follows status changes, the same way for CMS edits and the referee panel
        const status = data.status ?? originalDoc?.status
        if (status === 'sched') data.startedAt = null
        else if (status === 'live' && !(data.startedAt ?? originalDoc?.startedAt)) data.startedAt = new Date().toISOString()
        // stamp new events so they keep their order and the referee undo window works
        if (Array.isArray(data.events)) data.events = data.events.map((e: { ts?: number }, i: number) => ({ ...e, ts: e.ts || Date.now() + i }))
        if (data.stage === 'league') { data.round = null; data.penaltyWinner = null }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({ collection: 'votes', where: { match: { equals: id } }, req, overrideAccess: true })
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', admin: { hidden: true }, label: 'Maç' },
    {
      type: 'row',
      fields: [
        { name: 'home', type: 'relationship', relationTo: 'teams', label: 'Ev sahibi', required: true },
        {
          name: 'away',
          type: 'relationship',
          relationTo: 'teams',
          label: 'Deplasman',
          required: true,
          validate: (val: unknown, { data }: { data: Record<string, unknown> }) =>
            val && String(idOf(val)) === String(idOf(data?.home)) ? 'İki farklı takım seçin' : true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'kickoff', type: 'date', label: 'Tarih ve saat', admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy HH:mm' } } },
        { name: 'pitch', type: 'text', label: 'Saha', admin: { placeholder: 'Saha 1' } },
      ],
    },
    {
      name: 'events',
      type: 'array',
      label: 'Olaylar',
      labels: { singular: 'Olay', plural: 'Olaylar' },
      admin: {
        description: 'Gol ve kartlar. Skor, elle skor girilmedikçe buradan hesaplanır.',
        initCollapsed: true,
        components: { RowLabel: '/components/cms/EventRowLabel#EventRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              label: 'Tür',
              required: true,
              defaultValue: 'G',
              options: [
                { label: 'Gol', value: 'G' },
                { label: 'Kendi kalesine gol', value: 'OG' },
                { label: 'Sarı kart', value: 'Y' },
                { label: 'Kırmızı kart', value: 'R' },
              ],
            },
            {
              name: 'side',
              type: 'select',
              label: 'Oyuncunun takımı',
              required: true,
              defaultValue: 'home',
              options: [
                { label: 'Ev sahibi', value: 'home' },
                { label: 'Deplasman', value: 'away' },
              ],
              admin: { description: 'Kendi kalesine golde gol rakibe yazılır.' },
            },
            { name: 'minute', type: 'number', label: 'Dakika', min: 0, max: 200 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'player', type: 'text', label: 'Oyuncu' },
            { name: 'assist', type: 'text', label: 'Asist', admin: { condition: (_, s) => s?.kind === 'G' } },
          ],
        },
        { name: 'ts', type: 'number', admin: { hidden: true } },
      ],
    },
    {
      name: 'manualScore',
      type: 'group',
      label: 'Elle skor',
      admin: { description: 'İki kutu da doldurulursa skor olaylardan değil buradan alınır.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'home', type: 'number', label: 'Ev sahibi', min: 0 },
            { name: 'away', type: 'number', label: 'Deplasman', min: 0 },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Durum',
      required: true,
      defaultValue: 'sched',
      options: [
        { label: 'Başlamadı', value: 'sched' },
        { label: 'Canlı', value: 'live' },
        { label: 'Bitti', value: 'done' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'startedAt',
      type: 'date',
      label: 'Başlama anı',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Canlı sayaç bu andan sayar.' },
    },
    {
      name: 'stage',
      type: 'select',
      label: 'Aşama',
      required: true,
      defaultValue: 'league',
      options: [
        { label: 'Lig', value: 'league' },
        { label: 'Master Champions League', value: 'mcl' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'round',
      type: 'select',
      label: 'Tur',
      options: [
        { label: 'Yarı final 1', value: 'sf1' },
        { label: 'Yarı final 2', value: 'sf2' },
        { label: 'Final', value: 'f' },
        { label: '3.lük maçı', value: 't3' },
      ],
      admin: { position: 'sidebar', condition: (d) => d?.stage === 'mcl' },
    },
    {
      name: 'penaltyWinner',
      type: 'select',
      label: 'Penaltılarda kazanan',
      options: [
        { label: 'Ev sahibi', value: 'home' },
        { label: 'Deplasman', value: 'away' },
      ],
      admin: { position: 'sidebar', condition: (d) => d?.stage === 'mcl', description: 'Eleme maçı berabere biterse.' },
    },
  ],
}
