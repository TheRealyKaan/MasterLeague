import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Injuries: CollectionConfig = {
  slug: 'injuries',
  labels: { singular: 'Sakatlık', plural: 'Sakatlıklar' },
  admin: { useAsTitle: 'player', defaultColumns: ['player', 'team', 'note', 'expectedReturn'], group: 'Lig' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'team', type: 'relationship', relationTo: 'teams', label: 'Takım', required: true },
        { name: 'player', type: 'text', label: 'Oyuncu', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'note', type: 'text', label: 'Sakatlık', admin: { placeholder: 'Ayak bileği' } },
        { name: 'expectedReturn', type: 'text', label: 'Tahmini dönüş', admin: { placeholder: '2 hafta' } },
      ],
    },
  ],
}

export const Notices: CollectionConfig = {
  slug: 'notices',
  labels: { singular: 'Duyuru', plural: 'Duyurular' },
  defaultSort: '-publishedAt',
  admin: { useAsTitle: 'text', defaultColumns: ['text', 'publishedAt'], group: 'İçerik' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'text', type: 'textarea', label: 'Duyuru', required: true },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Yayın tarihi',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}

/** Fan poll votes. Written only by the site's vote action (one per device per match). */
export const Votes: CollectionConfig = {
  slug: 'votes',
  labels: { singular: 'Oy', plural: 'Taraftar oyları' },
  admin: { defaultColumns: ['match', 'side', 'createdAt'], group: 'İçerik' },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  indexes: [{ fields: ['match', 'voter'], unique: true }],
  fields: [
    { name: 'match', type: 'relationship', relationTo: 'matches', required: true, index: true },
    { name: 'voter', type: 'text', required: true },
    { name: 'side', type: 'select', required: true, options: [{ label: 'Ev sahibi', value: 'home' }, { label: 'Deplasman', value: 'away' }] },
  ],
}

export { Media } from './Media'
