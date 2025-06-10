import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { restaurantOrders } = body

    if (!Array.isArray(restaurantOrders)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Update display order for each restaurant
    const updatePromises = restaurantOrders.map(({ id, displayOrder }) =>
      prisma.restaurant.update({
        where: { id: parseInt(id) },
        data: { displayOrder: parseInt(displayOrder) }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'Restaurant order updated successfully'
    })

  } catch (error) {
    console.error('Error updating restaurant order:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant order' },
      { status: 500 }
    )
  }
} 