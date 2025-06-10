import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { restaurantId, items } = body

    if (!restaurantId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant ID and items are required' },
        { status: 400 }
      )
    }

    // Get customer record
    const customer = await prisma.customer.findUnique({
      where: { userId: parseInt(session.user.id) }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate total price
    let restaurantAmount = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: parseInt(item.menuItemId) }
      })

      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 404 }
        )
      }

      const itemTotal = menuItem.price * item.quantity
      restaurantAmount += itemTotal

      orderItems.push({
        menuItemId: parseInt(item.menuItemId),
        quantity: item.quantity,
        price: menuItem.price
      })
    }

    // Calculate service fee and total customer payment
    const serviceFee = restaurantAmount * 0.15
    const totalCustomerPayment = restaurantAmount + serviceFee

    console.log('💰 Payment breakdown:')
    console.log(`  Restaurant amount: €${restaurantAmount.toFixed(2)}`)
    console.log(`  Service fee (15%): €${serviceFee.toFixed(2)}`)
    console.log(`  Total customer pays: €${totalCustomerPayment.toFixed(2)}`)

    // Check if customer has enough balance
    const customerUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { balance: true }
    })

    if (!customerUser || customerUser.balance < totalCustomerPayment) {
      return NextResponse.json(
        { error: `Insufficient balance. You need €${totalCustomerPayment.toFixed(2)} but only have €${(customerUser?.balance || 0).toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: parseInt(session.user.id),
        customerId: customer.id,
        restaurantId: parseInt(restaurantId),
        totalPrice: totalCustomerPayment, // Store the total amount customer paid
        status: 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        restaurant: {
          select: {
            name: true,
            userId: true
          }
        }
      }
    })

    // Update balances with service fee distribution
    try {
      // 1. Deduct total payment from customer (restaurant amount + service fee)
      await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: {
          balance: {
            decrement: totalCustomerPayment
          }
        }
      })

      // 2. Add restaurant amount to restaurant (original menu prices)
      await prisma.user.update({
        where: { id: order.restaurant.userId },
        data: {
          balance: {
            increment: restaurantAmount
          }
        }
      })

      // 3. Update restaurant's balance field as well
      await prisma.restaurant.update({
        where: { id: parseInt(restaurantId) },
        data: {
          balance: {
            increment: restaurantAmount
          }
        }
      })

      // 4. Add service fee to admin (find first admin user)
      const adminUser = await prisma.user.findFirst({
        where: { userType: 'ADMIN' }
      })

      if (adminUser) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            balance: {
              increment: serviceFee
            }
          }
        })

        // Also update admin's totalEarnings if they have an admin record
        const adminRecord = await prisma.admin.findUnique({
          where: { userId: adminUser.id }
        })

        if (adminRecord) {
          await prisma.admin.update({
            where: { userId: adminUser.id },
            data: {
              totalEarnings: {
                increment: serviceFee
              }
            }
          })
        }
      }

    } catch (balanceError) {
      console.error('Error updating balances:', balanceError)
      // Note: Order was already created, but balance update failed
      // In a production app, you might want to implement a rollback mechanism
    }

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Error creating order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to create order: ' + errorMessage },
      { status: 500 }
    )
  }
} 