import { seedSampleOrders } from '@/lib/seed-orders'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await seedSampleOrders()
    return NextResponse.json({
      success: true,
      message: 'Sample orders seeded successfully!'
    })
  } catch (error) {
    console.error('Error seeding orders:', error)
    return NextResponse.json(
      { error: 'Failed to seed orders' },
      { status: 500 }
    )
  }
} 