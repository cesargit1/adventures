import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Adventures - AdventuresCalendar',
  description: 'Review and moderate adventure listings in the AdventuresCalendar admin area.',
}

export default function AdminAdventuresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
