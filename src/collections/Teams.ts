import type { CollectionConfig, Where } from 'payload'
import { anyone, isAdmin } from '../access'

export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: { singular: 'Takım', plural: 'Takımlar' },
  defaultSort: 'order',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'className', 'pointAdjustment', 'order'], group: 'Lig' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    // deleting a team also removes its matches and injury records (as the original app did)
    beforeDelete: [
      async ({ id, req }) => {
        const where: Where = { or: [{ home: { equals: id } }, { away: { equals: id } }] }
        await req.payload.delete({ collection: 'matches', where, req, overrideAccess: true })
        await req.payload.delete({ collection: 'injuries', where: { team: { equals: id } }, req, overrideAccess: true })
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Takım adı', required: true, unique: true },
        { name: 'className', type: 'text', label: 'Sınıf', admin: { placeholder: '9-C' } },
      ],
    },
    { name: 'players', type: 'text', hasMany: true, label: 'Oyuncular', admin: { description: 'Gol, asist ve kart almamış oyuncular da takım sayfasında görünür.' } },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Arma', admin: { description: 'Boş bırakılırsa baş harflerden renkli arma oluşur.' } },
    { name: 'order', type: 'number', label: 'Sıra', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'pointAdjustment',
      type: 'number',
      label: 'Puan düzeltmesi',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Pozitif sayı puan ekler, negatif siler (örn. −3 ceza).' },
    },
  ],
}
