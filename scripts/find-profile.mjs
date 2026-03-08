import dotenv from 'dotenv'
import pg from 'pg'

const { Client } = pg

function loadEnv() {
  dotenv.config({ path: '.env' })
}

function buildDbUrl() {
  const raw = process.env.SUPABASE_DB_URL
  const password = process.env.SUPABASE_DB_PASSWORD

  if (!raw) {
    throw new Error('Missing SUPABASE_DB_URL (expected in .env)')
  }

  if (raw.includes('[YOUR-PASSWORD]')) {
    if (!password) {
      throw new Error('SUPABASE_DB_URL contains [YOUR-PASSWORD] but SUPABASE_DB_PASSWORD is missing')
    }

    return raw.replace('[YOUR-PASSWORD]', encodeURIComponent(password))
  }

  return raw
}

const usernameArg = process.argv[2]
if (!usernameArg) {
  console.error('Usage: node scripts/find-profile.mjs <username>')
  process.exit(1)
}

loadEnv()

const dbUrl = buildDbUrl()

function sslFromUrl(url) {
  const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase()
  if (sslmode === 'disable') return undefined

  const host = url.hostname
  const defaultToSsl = host.endsWith('.supabase.co') || host.endsWith('.supabase.com')
  const useSsl = defaultToSsl || Boolean(sslmode)
  if (!useSsl) return undefined

  const verify = sslmode === 'verify-full' || sslmode === 'verify-ca'
  return {
    rejectUnauthorized: verify,
    servername: host,
  }
}

const url = new URL(dbUrl)
const client = new Client({
  host: url.hostname,
  port: url.port ? Number(url.port) : 5432,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, '') || 'postgres',
  ssl: sslFromUrl(url),
})

await client.connect()

try {
  const { rows } = await client.query(
    `select id, username, display_name, city, created_at
     from public.profiles
     where username ilike $1
     limit 5`,
    [usernameArg]
  )

  if (!rows.length) {
    console.log('No matching profile rows found.')
  } else {
    console.log(rows)
  }
} finally {
  await client.end()
}
