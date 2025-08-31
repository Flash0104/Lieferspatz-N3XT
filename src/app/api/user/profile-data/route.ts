import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Fetching profile data for user:', userId);

    // Fetch user profile from database
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        location: true,
        city: true,
        postalCode: true,
        streetName: true,
        blockNumber: true,
        balance: true,
        profilePicture: true,
        customer: {
          select: {
            address: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the address in the desired format: "Street Name House Number, City, Postal Code"
    let formattedLocation = '';
    if (user.location && user.city && user.postalCode) {
      formattedLocation = `${user.location}, ${user.city}, ${user.postalCode}`;
    } else if (user.location) {
      formattedLocation = user.location;
    }

    console.log('Found user profile:', {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      location: user.location,
      city: user.city,
      postalCode: user.postalCode,
      formattedLocation: formattedLocation
    });

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        location: formattedLocation, // Send the formatted address
        originalLocation: user.location, // Keep original for editing
        city: user.city,
        postalCode: user.postalCode,
        balance: user.balance,
        profilePicture: user.profilePicture,
        address: user.customer?.address || ''
      }
    });

  } catch (error) {
    console.error('Error fetching profile data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}
