import process from 'node:process'
import dns from 'node:dns/promises'
import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'
import pg from 'pg'

const { Client } = pg

function loadEnv() {
  const root = process.cwd()
  const envDb = path.join(root, '.env.db')
  const env = path.join(root, '.env')
  const envLocal = path.join(root, '.env.local')

  if (fs.existsSync(env)) dotenv.config({ path: env })
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true })
  if (fs.existsSync(envDb)) dotenv.config({ path: envDb, override: true })
}

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

async function createClientFromConnectionString(connectionString) {
  const url = new URL(connectionString)
  const originalHost = url.hostname
  const ssl = sslFromUrl(url)

  let resolvedHost = originalHost
  try {
    await dns.lookup(originalHost)
  } catch {
    try {
      const ipv6 = await dns.resolve6(originalHost)
      if (ipv6?.[0]) resolvedHost = ipv6[0]
    } catch {
      // keep original host
    }
  }

  return new Client({
    host: resolvedHost,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    ssl,
  })
}

async function main() {
  loadEnv()

  const slug = process.argv[2]
  if (!slug) {
    throw new Error('Usage: node scripts/diagnose-adventure.mjs <slug-or-id>')
  }

  const shortId = slug.split('-').pop() || null

  let connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Set SUPABASE_DB_URL (preferred) or DATABASE_URL to your Supabase Postgres connection string.')
  }

  if (connectionString.includes('[YOUR-PASSWORD]')) {
    const password = process.env.SUPABASE_DB_PASSWORD
    if (!password) {
      throw new Error('SUPABASE_DB_URL contains [YOUR-PASSWORD] but SUPABASE_DB_PASSWORD is not set.')
    }
    connectionString = connectionString.replace('[YOUR-PASSWORD]', encodeURIComponent(password))
  }

  const client = await createClientFromConnectionString(connectionString)
  await client.connect()

  try {
    const q = `
      select id, host_id, title, status, approved_at, submitted_at, title_slug, short_id, slug
      from public.adventures
      where id::text = $1
         or slug = $1
         or ($2 is not null and short_id = $2)
      limit 10;
    `

    const res = await client.query(q, [slug, shortId])
    console.log('rows:', res.rowCount)
    console.table(res.rows)

    if (res.rowCount === 0) {
      console.log('No matching row found for slug/id:', slug)
    }
  } finally {
    await client.end().catch(() => {})
  }
}

await main()
