import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/progress?profileId=user-1
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || 'user-1';

    const records = await prisma.watchProgress.findMany({
      where: { profileId },
      orderBy: { lastWatchedAt: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to get progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// POST /api/progress - Save where user paused
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId = 'user-1', titleId, episodeId = null, currentTime, duration } = body;

    if (!titleId || currentTime === undefined || !duration) {
      return NextResponse.json({ error: 'Missing required progress fields' }, { status: 400 });
    }

    const percentage = Math.min(100, Math.round((currentTime / duration) * 100));

    const record = await prisma.watchProgress.upsert({
      where: {
        profileId_titleId_episodeId: {
          profileId,
          titleId,
          episodeId,
        },
      },
      update: {
        currentTime,
        duration,
        percentage,
        lastWatchedAt: new Date(),
      },
      create: {
        profileId,
        titleId,
        episodeId,
        currentTime,
        duration,
        percentage,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Failed to save progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}

