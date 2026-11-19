import type { CollectionConfig } from 'payload'
import { adminOrSelf, isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  auth: { tokenExpiration: 60 * 60 * 12 },
  admin: { useAsTitle: 'email', defaultColumns: ['name', 'email', 'role'], group: 'Erişim' },
  access: {
    // only admins get into the CMS; referees work from the site's referee panel
    admin: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin',
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // the very first account (created on /admin) becomes the admin
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
          if (!totalDocs) data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Ad' },
    {
      name: 'role',
      type: 'select',
      label: 'Rol',
      required: true,
      defaultValue: 'referee',
      saveToJWT: true,
      access: { update: isAdminField },
      options: [
        { label: 'Yönetici', value: 'admin' },
        { label: 'Hakem', value: 'referee' },
      ],
      admin: { description: 'Hakemler CMS’e giremez; sitedeki Hakem panelinden seçtikleri maçı yönetir.' },
    },
    {
      name: 'assignedMatch',
      type: 'relationship',
      relationTo: 'matches',
      label: 'Yönettiği maç',
      admin: { condition: (d) => d?.role === 'referee', description: 'Hakem giriş yapınca kendisi seçer; buradan da atanabilir.' },
    },
  ],
}
