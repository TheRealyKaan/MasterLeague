import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'src/migrations/**', 'src/payload-types.ts', 'src/app/(payload)/**'] },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@next/next/no-img-element': 'off', // crests/logos come from the CMS at arbitrary sizes
    },
  },
]
