adventures/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                 # Public routes
│   │   │   ├── page.tsx              # / Landing
│   │   │   ├── browse/
│   │   │   ├── adventures/
│   │   │   │   └── [id]/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (auth)/                   # Protected routes (middleware)
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   │   ├── [userId]/
│   │   │   │   └── edit/
│   │   │   ├── notifications/
│   │   │   └── adventures/
│   │   │       ├── create/
│   │   │       └── [id]/
│   │   │           ├── edit/
│   │   │           └── manage/
│   │   ├── (admin)/                  # Admin routes (middleware)
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       ├── adventures/
│   │   │       └── dashboard/
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   ├── adventures/
│   │   │   ├── users/
│   │   │   ├── payments/
│   │   │   └── webhooks/             # Stripe, Supabase webhooks
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── adventure/
│   │   │   ├── AdventureCard.tsx
│   │   │   ├── AdventureMap.tsx
│   │   │   ├── AdventureCalendar.tsx
│   │   │   ├── AdventureForm.tsx
│   │   │   └── AdventureDetails.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── SearchResults.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── OAuthButtons.tsx
│   │   ├── user/
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   └── NotificationBell.tsx
│   │   └── admin/
│   │       ├── UserManagement.tsx
│   │       ├── AdventureModeration.tsx
│   │       └── AdminStats.tsx
│   ├── hooks/
│   │   ├── useAdventures.ts
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useNotifications.ts
│   │   └── usePayment.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── NotificationContext.tsx
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── adventures.ts
│   │   │   ├── users.ts
│   │   │   ├── auth.ts
│   │   │   └── payments.ts
│   │   ├── stripe.ts
│   │   └── notifications.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── filters.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── adventure.ts
│   │   ├── user.ts
│   │   ├── auth.ts
│   │   ├── payment.ts
│   │   └── notification.ts
│   └── middleware.ts                 # Next.js middleware
├── database/                         # Supabase schema & migrations
│   ├── migrations/
│   │   ├── 001_init_users.sql
│   │   ├── 002_init_adventures.sql
│   │   ├── 003_init_signups.sql
│   │   ├── 004_init_reviews.sql
│   │   ├── 005_init_payments.sql
│   │   ├── 006_init_notifications.sql
│   │   └── 007_init_admin.sql
│   ├── seeds/
│   │   ├── users.sql
│   │   └── adventures.sql
│   ├── schema.sql
│   └── README.md
├── shared/                           # Shared types & utilities
│   ├── types.ts
│   ├── constants.ts
│   ├── validators.ts
│   └── formatters.ts
├── public/
├── .env.local.example
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
├── package.json
├── postcss.config.mjs
└── README.md