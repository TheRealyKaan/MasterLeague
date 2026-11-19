import type { GlobalConfig } from 'payload'
import { anyone, isAdmin } from './access'
import { ABOUT, SETTINGS } from './lib/defaults.js'

const S = SETTINGS

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Lig ayarları',
  admin: { group: 'İçerik' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Genel',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'leagueName', type: 'text', label: 'Lig adı', required: true, defaultValue: S.leagueName },
                { name: 'season', type: 'text', label: 'Sezon', defaultValue: S.season },
              ],
            },
            { name: 'tagline', type: 'textarea', label: 'Ana sayfa açıklaması', defaultValue: S.tagline },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo', admin: { description: 'Boşsa varsayılan Master Lig logosu kullanılır.' } },
            { name: 'footerNote', type: 'text', label: 'Alt bilgi', defaultValue: S.footerNote },
          ],
        },
        {
          label: 'Görünüm',
          fields: [
            {
              name: 'themeColor',
              type: 'text',
              label: 'Tema rengi',
              defaultValue: S.themeColor,
              validate: (v: unknown) => (!v || /^#[0-9a-f]{6}$/i.test(String(v)) ? true : '#RRGGBB biçiminde girin'),
              admin: { description: 'Material You paletinin tohum rengi (#RRGGBB). Tüm açık ve koyu renkler bundan üretilir.' },
            },
          ],
        },
        {
          label: 'Kurallar',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'pointsWin', type: 'number', label: 'Galibiyet puanı', defaultValue: S.pointsWin, min: 0, required: true },
                { name: 'pointsDraw', type: 'number', label: 'Beraberlik puanı', defaultValue: S.pointsDraw, min: 0, required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'matchMinutes', type: 'number', label: 'Maç süresi (dk)', defaultValue: S.matchMinutes, min: 1, max: 200, required: true },
                { name: 'undoMinutes', type: 'number', label: 'Hakem geri alma süresi (dk)', defaultValue: S.undoMinutes, min: 0, max: 60, required: true },
              ],
            },
            { name: 'timezone', type: 'text', label: 'Saat dilimi', defaultValue: S.timezone, admin: { description: 'IANA adı, örn. Europe/Istanbul. Maç günleri ve haftalar buna göre hesaplanır.' } },
          ],
        },
      ],
    },
  ],
}

export const About: GlobalConfig = {
  slug: 'about',
  label: 'Hakkında sayfası',
  admin: { group: 'İçerik' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'sections',
      type: 'array',
      label: 'Bölümler',
      defaultValue: ABOUT.sections,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'icon', type: 'text', label: 'İkon', admin: { description: 'Material Symbols adı, örn. trophy', width: '30%' } },
            { name: 'title', type: 'text', label: 'Başlık', required: true },
          ],
        },
        { name: 'body', type: 'textarea', label: 'Metin', required: true },
      ],
    },
    {
      name: 'rules',
      type: 'array',
      label: 'Kurallar',
      defaultValue: ABOUT.rules,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'icon', type: 'text', label: 'İkon', admin: { width: '30%' } },
            { name: 'text', type: 'textarea', label: 'Kural', required: true },
          ],
        },
      ],
    },
  ],
}

export const ChampionsLeague: GlobalConfig = {
  slug: 'champions-league',
  label: 'Master Champions League',
  admin: { group: 'Lig', description: 'Sitedeki Yönetim sayfasından ilk 4 ile başlatılır; buradan elle de düzenlenebilir.' },
  access: { read: anyone, update: isAdmin },
  fields: [
    { name: 'active', type: 'checkbox', label: 'Başladı', defaultValue: false },
    { name: 'seeds', type: 'relationship', relationTo: 'teams', hasMany: true, maxRows: 4, label: 'İlk 4 (sırayla)' },
    { name: 'startedAt', type: 'date', label: 'Başlama tarihi' },
  ],
}
