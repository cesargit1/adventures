import type { Metadata } from 'next'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata: Metadata = {
  title: 'Admin - AdventuresCalendar',
  description: 'Administration area for managing AdventuresCalendar.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
