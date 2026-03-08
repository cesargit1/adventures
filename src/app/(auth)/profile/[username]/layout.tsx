import type { Metadata } from 'next'
import { UserProfileNavLayout } from '@/components/user/UserProfileNavLayout'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)

  return {
    title: `${username} - Account - AdventuresCalendar`,
    description: `Manage ${username}'s adventures, dashboard activity, and profile settings on AdventuresCalendar.`,
  }
}

export default async function UserProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username: rawUsername } = await params

  return (
    <UserProfileNavLayout username={rawUsername}>
      {children}
    </UserProfileNavLayout>
  )
}
