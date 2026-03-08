import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)

  return {
    title: `${username} - Profile - AdventuresCalendar`,
    description: `View ${username}'s profile, hosted adventures, and reviews on AdventuresCalendar.`,
  }
}

export default async function UserProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
