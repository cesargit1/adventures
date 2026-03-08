import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)

  return {
    title: `Dashboard - ${username} - AdventuresCalendar`,
    description: `View stats and recent activity for ${username}'s AdventuresCalendar account dashboard.`,
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
