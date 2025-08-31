import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { latitude, longitude, location, city, postal_code, full_address } = body;

    console.log('Received location data:', { latitude, longitude, location, city, postal_code, full_address });

    // Validate required fields
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Extract street name and block number from location if available
    let streetName = null;
    let blockNumber = null;
    
    if (location) {
      // Try to extract street name and number from "Street Name 123" format
      const streetMatch = location.match(/^(.+?)\s+(\d+)$/);
      if (streetMatch) {
        streetName = streetMatch[1]; // e.g., "Sonnenwall"
        blockNumber = streetMatch[2]; // e.g., "56"
      } else {
        streetName = location; // Use the whole string as street name
      }
    }

    console.log('Parsed street info:', { streetName, blockNumber });

    // Update user location in database
    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(session.user.id) // Convert string to number for Prisma
      },
      data: {
        latitude: latitude,
        longitude: longitude,
        location: location || null, // Full street address
        streetName: streetName,
        blockNumber: blockNumber,
        city: city || null,
        postalCode: postal_code || null,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Location updated successfully',
      location: {
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        location: updatedUser.location,
        city: updatedUser.city,
        postal_code: updatedUser.postalCode // Fixed to match schema camelCase
      }
    });

  } catch (error) {
    console.error('Error updating user location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
