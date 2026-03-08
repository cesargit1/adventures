import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - AdventuresCalendar',
  description: 'Monitor platform metrics and recent activity in the AdventuresCalendar admin dashboard.',
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
