import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Görsel', plural: 'Görseller' },
  admin: { group: 'İçerik' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: { mimeTypes: ['image/*'], imageSizes: [{ name: 'crest', width: 256, height: 256, fit: 'cover' }] },
  fields: [{ name: 'alt', type: 'text', label: 'Açıklama', required: true }],
}
