const { PrismaClient } = require('./src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding restaurants...')

  // Create restaurant users first
  const restaurantUser1 = await prisma.user.upsert({
    where: { email: 'kfc@restaurant.com' },
    update: {},
    create: {
      email: 'kfc@restaurant.com',
      password: await bcrypt.hash('password123', 10),
      userType: 'RESTAURANT',
      firstName: 'KFC',
      lastName: 'Manager',
      location: 'Königstraße 56, Duisburg',
      postalCode: '47051',
      city: 'Duisburg',
      streetName: 'Königstraße',
      blockNumber: '56',
      latitude: 51.4344,
      longitude: 6.7623,
      balance: 0.0
    }
  })

  const restaurantUser2 = await prisma.user.upsert({
    where: { email: 'burger@restaurant.com' },
    update: {},
    create: {
      email: 'burger@restaurant.com',
      password: await bcrypt.hash('password123', 10),
      userType: 'RESTAURANT',
      firstName: 'Burger',
      lastName: 'House',
      location: 'Mülheimer Straße 123, Duisburg',
      postalCode: '47057',
      city: 'Duisburg',
      streetName: 'Mülheimer Straße',
      blockNumber: '123',
      latitude: 51.4456,
      longitude: 6.7789,
      balance: 0.0
    }
  })

  // Create restaurants
  const restaurant1 = await prisma.restaurant.upsert({
    where: { userId: restaurantUser1.id },
    update: {},
    create: {
      userId: restaurantUser1.id,
      name: "N'eighbour KFC Lover",
      address: 'Königstraße 56, Duisburg',
      city: 'Duisburg',
      streetName: 'Königstraße',
      blockNumber: '56',
      postalCode: '47051',
      description: 'Delicious fried chicken and fast food',
      rating: 4.0,
      isOpen: true,
      displayOrder: 1,
      courierType: 'CYCLE',
      averagePrepTime: 20,
      latitude: 51.4344,
      longitude: 6.7623,
      imageUrl: '/images/restaurants/kfc.jpg'
    }
  })

  const restaurant2 = await prisma.restaurant.upsert({
    where: { userId: restaurantUser2.id },
    update: {},
    create: {
      userId: restaurantUser2.id,
      name: 'Burger House Deluxe',
      address: 'Mülheimer Straße 123, Duisburg',
      city: 'Duisburg',
      streetName: 'Mülheimer Straße',
      blockNumber: '123',
      postalCode: '47057',
      description: 'Premium burgers and grill specialties',
      rating: 4.5,
      isOpen: true,
      displayOrder: 2,
      courierType: 'MOTORCYCLE',
      averagePrepTime: 25,
      latitude: 51.4456,
      longitude: 6.7789,
      imageUrl: '/images/restaurants/burger.jpg'
    }
  })

  // Create menu items for KFC
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant1.id,
        name: 'Crispy Chicken Burger',
        description: 'Juicy chicken breast with crispy coating',
        price: 10.00,
        category: 'Burgers',
        imageUrl: '/images/menu/chicken-burger.jpg'
      },
      {
        restaurantId: restaurant1.id,
        name: 'Chicken Wings (6 pieces)',
        description: 'Spicy chicken wings with sauce',
        price: 8.50,
        category: 'Appetizers',
        imageUrl: '/images/menu/chicken-wings.jpg'
      },
      {
        restaurantId: restaurant1.id,
        name: 'French Fries',
        description: 'Golden crispy fries',
        price: 4.50,
        category: 'Sides',
        imageUrl: '/images/menu/fries.jpg'
      }
    ]
  })

  // Create menu items for Burger House
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant2.id,
        name: 'Classic Beef Burger',
        description: 'Beef patty with lettuce, tomato, and sauce',
        price: 12.00,
        category: 'Burgers',
        imageUrl: '/images/menu/beef-burger.jpg'
      },
      {
        restaurantId: restaurant2.id,
        name: 'Cheese Deluxe',
        description: 'Double cheese burger with special sauce',
        price: 14.50,
        category: 'Burgers',
        imageUrl: '/images/menu/cheese-burger.jpg'
      },
      {
        restaurantId: restaurant2.id,
        name: 'Onion Rings',
        description: 'Crispy golden onion rings',
        price: 5.50,
        category: 'Sides',
        imageUrl: '/images/menu/onion-rings.jpg'
      }
    ]
  })

  console.log('✅ Restaurants seeded successfully!')
  console.log(`Created restaurant: ${restaurant1.name}`)
  console.log(`Created restaurant: ${restaurant2.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
