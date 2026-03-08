import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'

function loadEnv() {
  const root = process.cwd()
  const env = path.join(root, '.env')
  if (fs.existsSync(env)) dotenv.config({ path: env })
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

async function main() {
  loadEnv()
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const publishableKey = requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

  const url = new URL('/auth/v1/health', supabaseUrl)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Supabase API health check failed: ${response.status} ${response.statusText}\n${body}`)
  }

  const json = await response.json().catch(() => ({}))
  // eslint-disable-next-line no-console
  console.log('✅ Supabase API reachable')
  // eslint-disable-next-line no-console
  console.log('   URL:', supabaseUrl)
  // eslint-disable-next-line no-console
  console.log('   Health:', json)
}

await main()
