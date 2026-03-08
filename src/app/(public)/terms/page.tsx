import type { Metadata } from 'next'

import { Container } from '@/components/common/Container'

export const metadata: Metadata = {
  title: 'Terms of Use - AdventuresCalendar',
  description:
    'Read the rules, responsibilities, and limitations that apply when using AdventuresCalendar.',
}

const lastUpdated = 'March 8, 2026'

const sections = [
  {
    title: 'Using AdventuresCalendar',
    body: [
      'By accessing or using AdventuresCalendar, you agree to these Terms of Use. If you do not agree, do not use the service.',
      'You must use the platform only in compliance with applicable law and only for its intended purpose of discovering, hosting, and participating in outdoor adventures and related community features.',
    ],
  },
  {
    title: 'Accounts and profile information',
    body: [
      'You are responsible for maintaining the confidentiality of your account credentials and for activity that occurs under your account. You agree to provide accurate information and keep it reasonably up to date.',
      'We may suspend or terminate accounts that violate these terms, create risk for other users, or interfere with the integrity or security of the service.',
    ],
  },
  {
    title: 'Adventure listings and community content',
    body: [
      'You are responsible for content you submit, including profile details, adventure listings, comments, reviews, images, and other materials. You represent that you have the right to submit that content and that it does not violate the law or the rights of others.',
      'By posting content to AdventuresCalendar, you grant us a non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, and distribute that content as needed to operate, improve, and promote the service.',
      'We may remove content that violates these terms or that we believe is harmful, misleading, unlawful, abusive, infringing, unsafe, or otherwise objectionable.',
    ],
  },
  {
    title: 'Safety and participation',
    body: [
      'Outdoor activities can involve inherent risks, including property damage, injury, illness, or death. You are responsible for evaluating whether an adventure is appropriate for you, bringing suitable gear, and using your own judgment before participating or hosting.',
      'Hosts are responsible for describing their adventures accurately, setting reasonable expectations, complying with applicable laws and permits, and acting in a safe and respectful manner. Participants are responsible for their own decisions and conduct.',
      'AdventuresCalendar is a platform for connecting users. Unless we expressly say otherwise, we do not organize, supervise, endorse, guarantee, or insure any specific adventure, host, participant, location, or outcome.',
    ],
  },
  {
    title: 'Prohibited conduct',
    body: [
      'You may not use the service to harass others, post unlawful or infringing material, impersonate another person, interfere with the platform, scrape or misuse data, distribute malware, attempt unauthorized access, or use the service in a way that creates risk or harm.',
      'You may not post false, misleading, or deceptive adventure information, manipulate reviews or engagement, or violate the privacy or intellectual property rights of others.',
    ],
  },
  {
    title: 'Payments and paid features',
    body: [
      'If AdventuresCalendar offers paid features, promotions, or adventure-related payments, additional terms may apply at the time of purchase. You are responsible for reviewing those terms before completing a transaction.',
      'Unless otherwise stated, fees are non-refundable except where required by law or where we expressly provide otherwise.',
    ],
  },
  {
    title: 'Disclaimers and limitation of liability',
    body: [
      'The service is provided on an as is and as available basis without warranties of any kind, whether express or implied, to the fullest extent permitted by law. We do not guarantee that the service will always be available, secure, accurate, or error-free.',
      'To the fullest extent permitted by law, AdventuresCalendar and its operators will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, data, goodwill, or business opportunities arising out of or related to your use of the service or participation in any adventure.',
    ],
  },
  {
    title: 'Indemnity and changes',
    body: [
      'You agree to defend, indemnify, and hold harmless AdventuresCalendar and its operators from claims, liabilities, damages, losses, and expenses arising out of your content, your adventures, your conduct, or your violation of these terms or applicable law.',
      'We may update these Terms of Use from time to time. When we do, we will post the revised version on this page and update the last updated date. Your continued use of the service after changes become effective means you accept the updated terms.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="bg-white py-16 sm:py-20">
      <Container className="max-w-4xl">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Terms of Use
          </h1>
          <p className="mt-4 text-sm text-gray-500">Last updated {lastUpdated}</p>
          <p className="mt-8 text-base leading-7 text-gray-700">
            These Terms of Use govern your access to and use of AdventuresCalendar, including our
            website, accounts, adventure listings, community features, and related services.
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
