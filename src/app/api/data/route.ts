import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  try {
    const value = await kv.get(key)
    return NextResponse.json({ value })
  } catch {
    return NextResponse.json({ value: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    await kv.set(key, value)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
