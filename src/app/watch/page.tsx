'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/player/VideoPlayer';
import { Title } from '@/types';

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const titleId = searchParams.get('titleId');
  const episodeId = searchParams.get('episodeId');

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!titleId) {
      setLoading(false);
      return;
    }

    fetch(`/api/titles/${titleId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setTitle(data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [titleId]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-gray-400 font-mono">Loading stream manifest from database...</p>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
        <p className="text-gray-400 mb-6 text-sm">The title could not be found in your SQLite database.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors"
        >
          Return to Browse
        </button>
      </div>
    );
  }

  // Determine current episode and stream URL
  let streamUrl = title.videoUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  let subTitleText = '';
  let introStart = title.introStart || 0;
  let introEnd = title.introEnd || 0;
  let hasNextEpisode = false;
  let nextEpisodeId: string | undefined;

  if ((title.type === 'series' || title.type === 'anime') && title.seasons) {
    const allEpisodes = title.seasons.flatMap((s) => s.episodes || []);
    const currentIndex = episodeId ? allEpisodes.findIndex((e) => e.id === episodeId) : 0;
    const currentEpisode = allEpisodes[currentIndex] || allEpisodes[0];

    if (currentEpisode) {
      streamUrl = currentEpisode.videoUrl;
      subTitleText = `S${currentEpisode.seasonNumber}:E${currentEpisode.episodeNumber} - ${currentEpisode.title}`;
      introStart = currentEpisode.introStart || 0;
      introEnd = currentEpisode.introEnd || 0;

      if (currentIndex < allEpisodes.length - 1) {
        hasNextEpisode = true;
        nextEpisodeId = allEpisodes[currentIndex + 1].id;
      }
    }
  }

  const handleNextEpisode = () => {
    if (nextEpisodeId) {
      router.push(`/watch?titleId=${title.id}&episodeId=${nextEpisodeId}`);
    }
  };

  return (
    <VideoPlayer
      src={streamUrl}
      title={title.title}
      subTitle={subTitleText}
      titleId={title.id}
      episodeId={episodeId || undefined}
      introStart={introStart}
      introEnd={introEnd}
      onBack={() => router.push('/')}
      onNextEpisode={handleNextEpisode}
      hasNextEpisode={hasNextEpisode}
    />
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
