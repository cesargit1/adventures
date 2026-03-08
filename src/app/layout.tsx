import type { Metadata } from 'next'
import { Navigation } from '@/components/common/Navigation'
import { Footer } from '@/components/common/Footer'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'AdventuresCalendar - Discover Outdoor Adventures',
  description: 'Find and join outdoor adventure events near you. Hiking, camping, climbing, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <Navigation />
        <main className="pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
