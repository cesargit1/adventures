import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-white text-gray-900 py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Image src="/AdventuresCalendar.png" alt="AdventuresCalendar" width={160} height={160} className="mb-4" />
            <p className="text-sm text-gray-600">Discover and join outdoor adventure events near you.</p>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Adventures</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-black">
                  Map
                </Link>
              </li>
              <li>
                <Link href="/?view=calendar" className="text-gray-600 hover:text-black">
                  Calendar
                </Link>
              </li>
              <li>
                <Link href="/?view=list" className="text-gray-600 hover:text-black">
                  List
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="text-gray-600 hover:text-black">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-black">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-black">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-black">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-black">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-center text-gray-500">
            &copy; 2026 AdventuresCalendar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
