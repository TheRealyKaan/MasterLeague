import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'referee'
const roleOf = (user: unknown): Role | undefined => (user as { role?: Role } | null)?.role

export const isAdmin: Access = ({ req }) => roleOf(req.user) === 'admin'
export const isAdminField: FieldAccess = ({ req }) => roleOf(req.user) === 'admin'
export const anyone: Access = () => true
/** Admins see everyone; other signed-in users only themselves. */
export const adminOrSelf: Access = ({ req }) => {
  if (roleOf(req.user) === 'admin') return true
  return req.user ? { id: { equals: req.user.id } } : false
}
