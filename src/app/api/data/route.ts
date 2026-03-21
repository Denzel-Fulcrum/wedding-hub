import { NextRequest, NextResponse } from 'next/server'

const url = process.env.STORAGE_URL || process.env.KV_REST_API_URL || ''
const token = process.env.STORAGE_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || ''

async function kvGet(key: string) {
  const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  return data.result
}

async function kvSet(key: string, value: any) {
  await fetch(`${url}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, JSON.stringify(value)])
  })
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  try {
    const raw = await kvGet(key)
    const value = raw ? JSON.parse(raw) : null
    return NextResponse.json({ value })
  } catch {
    return NextResponse.json({ value: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    await kvSet(key, value)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
