const { PrismaClient } = require('./src/generated/prisma');

async function updateSchwarmaAddress() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    
    const result = await prisma.restaurant.update({
      where: {
        name: 'Schawarma Eating Vader Master'
      },
      data: {
        streetName: 'Königsallee',
        blockNumber: '2',
        postalCode: '40212',
        address: 'Königsallee 2, Düsseldorf'
      }
    });

    console.log('Updated restaurant:', result);
    console.log('Successfully updated Schawarma restaurant address');

  } catch (error) {
    console.error('Error updating restaurant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSchwarmaAddress(); 