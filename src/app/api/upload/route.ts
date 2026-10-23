import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

export async function POST(request: Request) {
  // 1. Authorization check
  const token = request.headers.get('x-admin-token');
  if (token !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized: Admin token required' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('video') || formData.get('image')) as File | null;
    const uploadType = (formData.get('type') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalName = file.name || 'upload.bin';
    const ext = path.extname(originalName).toLowerCase();
    const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${cleanBase}${ext}`;

    const isImage = uploadType === 'image' || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);

    // Write file to either posters or videos folder
    const targetFolder = isImage ? 'posters' : 'videos';
    const diskPath = path.join(process.cwd(), 'public', 'uploads', targetFolder, uniqueFilename);
    const publicUrl = `/uploads/${targetFolder}/${uniqueFilename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(diskPath, buffer);

    // If it's an image, return URL directly
    if (isImage) {
      return NextResponse.json({
        success: true,
        type: 'image',
        url: publicUrl,
        originalName,
      });
    }

    // Video processing
    let thumbnailUrl = '/uploads/thumbnails/default.jpg';
    let duration = 0;

    const thumbFilename = `${Date.now()}_${cleanBase}.jpg`;
    const thumbDiskPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', thumbFilename);

    try {
      await execAsync(`ffmpeg -y -ss 00:00:02 -i "${diskPath}" -vframes 1 -q:v 2 "${thumbDiskPath}"`);
      thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    } catch {
      thumbnailUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
    }

    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${diskPath}"`
      );
      duration = Math.round(parseFloat(stdout.trim())) || 0;
    } catch {}

    return NextResponse.json({
      success: true,
      type: 'video',
      videoUrl: publicUrl,
      url: publicUrl,
      thumbnailUrl,
      duration,
      originalName,
      titleSuggestion: cleanBase.replace(/_/g, ' '),
    });
  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
