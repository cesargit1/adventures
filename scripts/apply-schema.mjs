import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import dns from 'node:dns/promises'

import fsSync from 'node:fs'

import dotenv from 'dotenv'
import pg from 'pg'

const { Client } = pg

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function main() {
  {
    const root = process.cwd()
    const envDb = path.join(root, '.env.db')
    const env = path.join(root, '.env')
    const envLocal = path.join(root, '.env.local')

    if (fsSync.existsSync(env)) dotenv.config({ path: env })
    if (fsSync.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true })
    if (fsSync.existsSync(envDb)) dotenv.config({ path: envDb, override: true })
  }

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

  const url = new URL(connectionString)
  const originalHost = url.hostname
  const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase()
  const defaultToSsl = originalHost.endsWith('.supabase.co') || originalHost.endsWith('.supabase.com')
  const useSsl = (sslmode && sslmode !== 'disable') || defaultToSsl
  const verify = sslmode === 'verify-full' || sslmode === 'verify-ca'
  const ssl = useSsl
    ? {
        rejectUnauthorized: verify,
        servername: originalHost,
      }
    : undefined

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

  const repoRoot = process.cwd()
  const schemaPath = path.join(repoRoot, 'database', 'schema.sql')
  const sql = await fs.readFile(schemaPath, 'utf8')

  const client = new Client({
    host: resolvedHost,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    ssl,
  })

  await client.connect()
  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('commit')
    // eslint-disable-next-line no-console
    console.log('✅ Schema applied successfully')
  } catch (error) {
    try {
      await client.query('rollback')
    } catch {
      // ignore rollback failures
    }
    throw error
  } finally {
    await client.end()
  }
}

await main()
