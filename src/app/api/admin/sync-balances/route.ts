import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all restaurants with their user data
    const restaurants = await prisma.restaurant.findMany({
      include: {
        user: {
          select: {
            id: true,
            balance: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    const updates = []

    // Sync restaurant.balance with user.balance for all restaurant owners
    for (const restaurant of restaurants) {
      if (restaurant.balance !== restaurant.user.balance) {
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { balance: restaurant.user.balance }
        })
        
        updates.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          ownerName: `${restaurant.user.firstName} ${restaurant.user.lastName}`,
          oldBalance: restaurant.balance,
          newBalance: restaurant.user.balance
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updates.length} restaurant balances`,
      updates
    })

  } catch (error) {
    console.error('Error syncing balances:', error)
    return NextResponse.json(
      { error: 'Failed to sync balances' },
      { status: 500 }
    )
  }
} 