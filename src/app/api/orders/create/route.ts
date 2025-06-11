import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Add a simple in-memory lock to prevent duplicate orders
const orderLocks = new Set<string>()

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

    // Create a unique lock key for this user + restaurant combo
    const lockKey = `${session.user.id}-${restaurantId}`
    
    // Check if there's already an order being processed for this user/restaurant
    if (orderLocks.has(lockKey)) {
      return NextResponse.json(
        { error: 'Order already being processed, please wait' },
        { status: 429 }
      )
    }

    // Add lock
    orderLocks.add(lockKey)

    try {
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
      const orderItems: {
        menuItemId: number
        quantity: number
        price: number
      }[] = []

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

      // Use transaction to ensure all operations succeed or fail together
      const result = await prisma.$transaction(async (tx) => {
        console.log('🔄 Starting transaction...');
        
        // Manually find the next available order ID
        const lastOrder = await tx.order.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true }
        })
        
        const nextOrderId = (lastOrder?.id || 0) + 1
        console.log(`🆔 Last order ID: ${lastOrder?.id || 'none'}`)
        console.log(`🆔 Manually assigning order ID: ${nextOrderId}`)

        // Check if this ID already exists (debugging)
        const existingOrder = await tx.order.findUnique({
          where: { id: nextOrderId },
          select: { id: true }
        })
        
        if (existingOrder) {
          console.log(`❌ Order ID ${nextOrderId} already exists!`)
          throw new Error(`Order ID ${nextOrderId} already exists`)
        } else {
          console.log(`✅ Order ID ${nextOrderId} is available`)
        }

        console.log('📝 Creating order with data:', {
          id: nextOrderId,
          userId: parseInt(session.user.id),
          customerId: customer.id,
          restaurantId: parseInt(restaurantId),
          totalPrice: totalCustomerPayment,
          originalFee: restaurantAmount,
          serviceFee: serviceFee,
          status: 'PENDING'
        })

        // Create order with explicit ID - bypassing auto-increment issues
        const order = await tx.order.create({
          data: {
            id: nextOrderId, // Explicitly set the ID
            userId: parseInt(session.user.id),
            customerId: customer.id,
            restaurantId: parseInt(restaurantId),
            totalPrice: totalCustomerPayment,
            originalFee: restaurantAmount,
            serviceFee: serviceFee,
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

        console.log(`✅ Order created with ID: ${order.id}`)

        // Update customer balance
        console.log('💰 Updating customer balance...')
        await tx.user.update({
          where: { id: parseInt(session.user.id) },
          data: {
            balance: {
              decrement: totalCustomerPayment
            }
          }
        })

        // Update restaurant balance
        console.log('🏪 Updating restaurant balance...')
        await tx.user.update({
          where: { id: order.restaurant.userId },
          data: {
            balance: {
              increment: restaurantAmount
            }
          }
        })

        // Update restaurant's balance field
        await tx.restaurant.update({
          where: { id: parseInt(restaurantId) },
          data: {
            balance: {
              increment: restaurantAmount
            }
          }
        })

        // Add service fee to admin
        const adminUser = await tx.user.findFirst({
          where: { userType: 'ADMIN' }
        })

        if (adminUser) {
          console.log('👨‍💼 Updating admin balance...')
          await tx.user.update({
            where: { id: adminUser.id },
            data: {
              balance: {
                increment: serviceFee
              }
            }
          })

          // Update admin's totalEarnings if they have an admin record
          const adminRecord = await tx.admin.findUnique({
            where: { userId: adminUser.id }
          })

          if (adminRecord) {
            await tx.admin.update({
              where: { userId: adminUser.id },
              data: {
                totalEarnings: {
                  increment: serviceFee
                }
              }
            })
          }
        }

        // Try to create payment record
        console.log('💳 Creating payment record...')
        try {
          await tx.payment.create({
            data: {
              orderId: order.id,
              totalPrice: totalCustomerPayment,
              transactionStatus: 'completed'
            }
          })
          console.log('✅ Payment record created successfully')
        } catch (paymentError) {
          console.log('⚠️ Payment record creation failed, but order was created:', paymentError)
          // Continue without payment record for now
        }

        // Update the sequence to be in sync with the manually created order
        console.log('🔢 Updating sequence...')
        try {
          await tx.$executeRawUnsafe(`SELECT setval('orders_id_seq', ${nextOrderId}, true)`)
          console.log(`✅ Sequence updated to ${nextOrderId}`)
        } catch (seqError) {
          console.log('⚠️ Sequence update failed:', seqError)
        }

        console.log('🎉 Transaction completed successfully!')
        return order
      }, {
        timeout: 10000, // 10 second timeout
      })

      return NextResponse.json({
        success: true,
        order: result
      })

    } finally {
      // Always remove the lock
      orderLocks.delete(lockKey)
    }

  } catch (error) {
    console.error('Error creating order:', error)
    
    // Handle specific Prisma errors with detailed logging
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      console.log('🔍 Prisma error details:')
      console.log('  Code:', prismaError.code)
      console.log('  Meta:', prismaError.meta)
      console.log('  Message:', prismaError.message)
      
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target || 'unknown field'
        return NextResponse.json(
          { error: `Duplicate constraint violation on: ${target}` },
          { status: 409 }
        )
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to create order: ' + errorMessage },
      { status: 500 }
    )
  }
} 