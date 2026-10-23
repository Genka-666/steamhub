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
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const originalName = file.name || 'video.mp4';
    const ext = path.extname(originalName).toLowerCase() || '.mp4';
    const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${cleanBase}${ext}`;
    const videoDiskPath = path.join(process.cwd(), 'public', 'uploads', 'videos', uniqueFilename);
    const videoPublicUrl = `/uploads/videos/${uniqueFilename}`;

    // 2. Convert to Buffer and write video to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(videoDiskPath, buffer);

    let thumbnailUrl = '/uploads/thumbnails/default.jpg';
    let duration = 0;

    // 3. Attempt to generate thumbnail & probe duration using local FFmpeg / FFprobe
    const thumbFilename = `${Date.now()}_${cleanBase}.jpg`;
    const thumbDiskPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', thumbFilename);

    try {
      // Extract thumbnail at second 2
      await execAsync(`ffmpeg -y -ss 00:00:02 -i "${videoDiskPath}" -vframes 1 -q:v 2 "${thumbDiskPath}"`);
      thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
    } catch {
      // FFmpeg thumbnail fallback
      thumbnailUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
    }

    try {
      // Extract duration
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoDiskPath}"`
      );
      duration = Math.round(parseFloat(stdout.trim())) || 0;
    } catch {}

    return NextResponse.json({
      success: true,
      videoUrl: videoPublicUrl,
      thumbnailUrl,
      duration,
      originalName,
      titleSuggestion: cleanBase.replace(/_/g, ' '),
    });
  } catch (error: any) {
    console.error('Video upload failed:', error);
    return NextResponse.json({ error: error.message || 'Video upload failed' }, { status: 500 });
  }
}

