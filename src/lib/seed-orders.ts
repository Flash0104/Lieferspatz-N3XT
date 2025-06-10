import { prisma } from './prisma'

export async function seedSampleOrders() {
  try {
    // Get the first restaurant and customer
    const restaurant = await prisma.restaurant.findFirst({
      include: {
        menuItems: true
      }
    })

    const customer = await prisma.customer.findFirst({
      include: {
        user: true
      }
    })

    if (!restaurant || !customer || restaurant.menuItems.length === 0) {
      console.log('Need at least one restaurant with menu items and one customer to seed orders')
      return
    }

    // Create sample orders
    const sampleOrders = [
      {
        userId: customer.userId,
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: 'PENDING',
        totalPrice: 15.50,
        items: [
          {
            menuItemId: restaurant.menuItems[0].id,
            quantity: 2,
            price: restaurant.menuItems[0].price
          }
        ]
      },
      {
        userId: customer.userId,
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: 'ACCEPTED',
        totalPrice: 22.00,
        items: [
          {
            menuItemId: restaurant.menuItems[0].id,
            quantity: 1,
            price: restaurant.menuItems[0].price
          }
        ]
      },
      {
        userId: customer.userId,
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: 'DELIVERED',
        totalPrice: 18.75,
        items: [
          {
            menuItemId: restaurant.menuItems[0].id,
            quantity: 1,
            price: restaurant.menuItems[0].price
          }
        ]
      }
    ]

    for (const orderData of sampleOrders) {
      const order = await prisma.order.create({
        data: {
          userId: orderData.userId,
          customerId: orderData.customerId,
          restaurantId: orderData.restaurantId,
          status: orderData.status as any,
          totalPrice: orderData.totalPrice,
          items: {
            create: orderData.items
          }
        }
      })
      console.log(`Created order #${order.id} with status ${order.status}`)
    }

    console.log('Sample orders seeded successfully!')
    
  } catch (error) {
    console.error('Error seeding orders:', error)
  }
} 