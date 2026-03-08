import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Users - AdventuresCalendar',
  description: 'Manage users and permissions in the AdventuresCalendar admin area.',
}

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
