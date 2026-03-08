import type { Metadata } from 'next'

export function generateMetadata({
  params,
}: {
  params: { username: string }
}): Metadata {
  const username = decodeURIComponent(params.username)

  return {
    title: `My Adventures - ${username} - AdventuresCalendar`,
    description: `Manage hosted and upcoming adventures for ${username} on AdventuresCalendar.`,
  }
}

export default function MyAdventuresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
