import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const first = await prisma.restaurant.findFirst({ select: { id: true, name: true } })
    return NextResponse.json({ success: true, first })
  } catch (error: any) {
    return NextResponse.json({ success: false, name: error?.name, message: error?.message, stack: error?.stack }, { status: 500 })
  }
} 