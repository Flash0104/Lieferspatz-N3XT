import { NextResponse } from 'next/server'
 
export async function GET() {
  const url = process.env.DATABASE_URL || null
  const keys = Object.keys(process.env)
  return NextResponse.json({ DATABASE_URL_present: !!url, DATABASE_URL: url?.slice(0, 20) + '...' , envKeysSample: keys.slice(0, 20) })
} 