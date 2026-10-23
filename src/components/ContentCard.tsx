'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Info, Sparkles, Star } from 'lucide-react';
import { Title } from '@/types';
import { useWatch } from '@/context/WatchContext';

interface ContentCardProps {
  title: Title;
  showProgress?: boolean;
}

export default function ContentCard({ title, showProgress = true }: ContentCardProps) {
  const { setActiveModalTitle, isInWatchlist, toggleWatchlist, getProgress, setSelectedHeroTitle } = useWatch();

  const inList = isInWatchlist(title.id);
  const progress = getProgress(title.id);

  const handleSelectTitle = () => {
    setSelectedHeroTitle(title);
    setActiveModalTitle(title);
  };

  const handleSetHeroOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHeroTitle(title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative group/card flex-shrink-0 w-48 sm:w-56 md:w-64 cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30 select-none">
      {/* Thumbnail Container */}
      <div
        onClick={handleSelectTitle}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg group-hover/card:shadow-2xl group-hover/card:shadow-black/90 group-hover/card:border-emerald-500/40 transition-all duration-300"
      >
        {/* Poster / Backdrop Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={title.backdropUrl || title.posterUrl}
          alt={title.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
          loading="lazy"
        />

        {/* Ambient Dark Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

        {/* Format Pill Badge */}
        <span className="absolute top-2.5 left-2.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-300 shadow">
          {title.type}
        </span>

        {/* Short Clip Indicator Badge */}
        {title.clipUrl && (
          <span className="absolute top-2.5 right-2.5 text-[8px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-black backdrop-blur-md flex items-center gap-1 shadow-md font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
            CLIP
          </span>
        )}

        {/* Watch Progress Bar */}
        {showProgress && progress && progress.percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/90 backdrop-blur-sm">
            <div
              className="h-full bg-emerald-500 shadow-sm shadow-emerald-500/50 transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Quick Action Hover Metadata */}
      <div className="mt-2.5 px-0.5 flex items-center justify-between">
        <div className="overflow-hidden pr-2">
          <h3
            onClick={handleSelectTitle}
            className="text-xs md:text-sm font-bold text-zinc-300 truncate group-hover/card:text-emerald-400 transition-colors"
          >
            {title.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" />
              {title.matchScore}%
            </span>
            <span>•</span>
            <span>{title.releaseYear}</span>
            <span>•</span>
            <span className="border border-zinc-800 px-1 py-0.2 rounded text-[9px] text-zinc-400 font-medium">
              {title.rating}
            </span>
          </div>
        </div>

        {/* Quick Actions (Fade in on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <Link
            href={`/watch?titleId=${title.id}`}
            className="p-1.5 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-all hover:scale-110 shadow-md active:scale-95"
            title="Play Stream"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </Link>

          <button
            onClick={handleSetHeroOnly}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-full transition-all border border-zinc-800 hover:scale-110 active:scale-95"
            title="Preview on Billboard Background"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(title.id);
            }}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all border border-zinc-800 hover:scale-110 active:scale-95"
            title={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTitle();
            }}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all border border-zinc-800 hover:scale-110 active:scale-95"
            title="More Details & Episodes"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
