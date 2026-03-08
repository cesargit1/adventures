import type { Metadata } from 'next'

import { Container } from '@/components/common/Container'

export const metadata: Metadata = {
  title: 'Privacy Policy - AdventuresCalendar',
  description:
    'Read how AdventuresCalendar collects, uses, protects, and shares personal information.',
}

const lastUpdated = 'March 8, 2026'

const sections = [
  {
    title: 'Information we collect',
    body: [
      'We collect information you provide directly, such as your account details, username, display name, profile bio, city, state, certifications, uploaded profile images, and any other information you choose to add to your profile.',
      'We also collect content you create or submit through the platform, including adventure listings, signups, comments, reviews, messages you send through the service, and other activity related to participating in or hosting adventures.',
      'Like most online services, we and our service providers may automatically receive technical information such as IP address, browser type, device information, pages viewed, timestamps, and similar diagnostic data needed to operate, secure, and improve the site.',
    ],
  },
  {
    title: 'How we use information',
    body: [
      'We use personal information to create and manage accounts, publish profiles and adventure listings, process signups, provide customer support, personalize the experience, maintain safety, and communicate important updates about the service.',
      'We may also use information to monitor platform health, prevent fraud or abuse, enforce our rules, comply with legal obligations, and improve features, performance, and reliability.',
    ],
  },
  {
    title: 'How information is shared',
    body: [
      'We do not sell your personal information to third parties.',
      'We may share information with service providers that help us operate AdventuresCalendar, such as hosting, authentication, database, storage, analytics, communications, or payment processing providers, but only as reasonably needed to run the service.',
      'Information you choose to make public, such as your public profile, adventure listings, reviews, and comments, may be visible to other users and visitors. We may also disclose information if required by law, to protect rights and safety, or in connection with a merger, acquisition, or transfer of assets.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can review and update much of your account and profile information from your account settings. If you no longer want to use the service, you may request account deletion or removal of certain content, subject to legal, security, fraud-prevention, and legitimate recordkeeping needs.',
      'You may control cookies or similar browser storage through your browser settings, although some features may not function properly if these controls are disabled.',
    ],
  },
  {
    title: 'Data retention and security',
    body: [
      'We keep information for as long as it is reasonably necessary to provide the service, maintain business and legal records, resolve disputes, enforce agreements, and protect the platform.',
      'We use reasonable administrative, technical, and organizational safeguards designed to protect information. No system is completely secure, so we cannot guarantee absolute security.',
    ],
  },
  {
    title: 'Children\'s privacy',
    body: [
      'AdventuresCalendar is not intended for children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, please contact us so we can review and remove it where appropriate.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this Privacy Policy from time to time. When we do, we will post the revised version on this page and update the last updated date above. Your continued use of the service after changes become effective means the updated policy will apply.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="bg-white py-16 sm:py-20">
      <Container className="max-w-4xl">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Privacy</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-gray-500">Last updated {lastUpdated}</p>
          <p className="mt-8 text-base leading-7 text-gray-700">
            This Privacy Policy explains how AdventuresCalendar collects, uses, stores, and shares
            information when you browse the site, create an account, join adventures, host adventures,
            or otherwise use our services.
          </p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                <div className="mt-4 space-y-4 text-base leading-7 text-gray-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}
