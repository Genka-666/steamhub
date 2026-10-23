'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Info, Plus, Check, Volume2, VolumeX } from 'lucide-react';
import { Title } from '@/types';
import { useWatch } from '@/context/WatchContext';

interface HeroBannerProps {
  title: Title;
}

export default function HeroBanner({ title }: HeroBannerProps) {
  const { setActiveModalTitle, isInWatchlist, toggleWatchlist } = useWatch();
  const [isMuted, setIsMuted] = React.useState(true);

  const inList = isInWatchlist(title.id);

  return (
    <div className="relative w-full h-[75vh] md:h-[88vh] bg-zinc-950 overflow-hidden select-none">
      {/* Background Backdrop Image with Vignette & Dark Gradients */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
        style={{
          backgroundImage: `url(${title.backdropUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent z-10" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-12 max-w-3xl">
        {/* Badges */}
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          <span className="text-emerald-400 font-extrabold text-xs tracking-wider">
            {title.matchScore}% Match
          </span>
          <span className="text-[11px] px-1.5 py-0.5 bg-zinc-800/80 text-gray-200 border border-zinc-700 rounded font-semibold">
            {title.rating}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 bg-zinc-800/80 text-gray-200 border border-zinc-700 rounded font-semibold">
            {title.qualityBadge}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 bg-zinc-800/80 text-gray-200 border border-zinc-700 rounded font-semibold">
            {title.audioBadge}
          </span>
        </div>

        {/* Title Heading */}
        <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight mb-3 drop-shadow-lg">
          {title.title}
        </h1>

        {/* Synopsis */}
        <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 mb-6 font-normal max-w-2xl text-shadow">
          {title.synopsis}
        </p>

        {/* Genre Pills */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {title.genres.map((g) => (
            <span key={g} className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              {g}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/watch?titleId=${title.id}`}
            className="bg-white hover:bg-gray-200 text-black px-6 md:px-8 py-3 rounded-lg font-bold flex items-center gap-2.5 transition-all duration-200 hover:scale-105 shadow-xl"
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </Link>

          <button
            onClick={() => setActiveModalTitle(title)}
            className="bg-zinc-800/80 hover:bg-zinc-700/80 text-white px-5 md:px-6 py-3 rounded-lg font-semibold flex items-center gap-2 backdrop-blur border border-zinc-700 transition-all hover:scale-105"
          >
            <Info className="w-5 h-5" />
            More Info
          </button>

          <button
            onClick={() => toggleWatchlist(title.id)}
            className="p-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 text-white border border-zinc-700 transition-colors"
            title={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Ambient audio toggle (decorational) */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-20 right-6 md:right-12 z-20 p-2.5 rounded-full bg-zinc-900/70 border border-zinc-700 text-gray-300 hover:text-white transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}

