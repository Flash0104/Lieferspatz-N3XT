import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, type, entityId } = body;

    if (!url || !type) {
      return NextResponse.json({ error: 'URL and type are required' }, { status: 400 });
    }

    if (!['profile', 'restaurant', 'menu'].includes(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Validate URL format
    let imageUrl: URL;
    try {
      imageUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check if URL points to an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const urlPath = imageUrl.pathname.toLowerCase();
    const isImageUrl = imageExtensions.some(ext => urlPath.endsWith(ext));
    
    if (!isImageUrl) {
      return NextResponse.json({ 
        error: 'URL must point to an image file (jpg, png, gif, webp, bmp)' 
      }, { status: 400 });
    }

    // Download the image from URL
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to download image from URL' }, { status: 400 });
    }

    // Check content type
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL does not contain a valid image' }, { status: 400 });
    }

    // Check file size (5MB limit)
    const contentLength = imageResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = urlPath.split('.').pop() || 'jpg';
    const fileName = `${type}_${session.user.id}_${timestamp}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    const filePath = join(uploadDir, fileName);

    // Create directory if it doesn't exist
    await writeFile(filePath, buffer).catch(async (error) => {
      if (error.code === 'ENOENT') {
        const { mkdir } = await import('fs/promises');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
      } else {
        throw error;
      }
    });

    const publicUrl = `/uploads/${type}/${fileName}`;

    // Update database based on type
    let updateResult;
    if (type === 'profile') {
      updateResult = await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: { profilePicture: publicUrl }
      });
    } else if (type === 'restaurant' && entityId) {
      // Verify user owns this restaurant
      const restaurant = await prisma.restaurant.findFirst({
        where: { 
          id: parseInt(entityId),
          userId: parseInt(session.user.id)
        }
      });
      
      if (!restaurant && session.user.userType !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      updateResult = await prisma.restaurant.update({
        where: { id: parseInt(entityId) },
        data: { imageUrl: publicUrl }
      });
    } else if (type === 'menu' && entityId) {
      // Verify user owns the restaurant that owns this menu item
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: parseInt(entityId) },
        include: { restaurant: true }
      });
      
      if (!menuItem || (menuItem.restaurant.userId !== parseInt(session.user.id) && session.user.userType !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      updateResult = await prisma.menuItem.update({
        where: { id: parseInt(entityId) },
        data: { imageUrl: publicUrl }
      });
    }

    return NextResponse.json({
      message: 'Image uploaded successfully from URL',
      url: publicUrl,
      type,
      entityId,
      originalUrl: url
    });

  } catch (error) {
    console.error('URL upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 