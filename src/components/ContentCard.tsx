'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Info } from 'lucide-react';
import { Title } from '@/types';
import { useWatch } from '@/context/WatchContext';

interface ContentCardProps {
  title: Title;
  showProgress?: boolean;
}

export default function ContentCard({ title, showProgress = true }: ContentCardProps) {
  const { setActiveModalTitle, isInWatchlist, toggleWatchlist, getProgress } = useWatch();

  const inList = isInWatchlist(title.id);
  const progress = getProgress(title.id);

  return (
    <div className="relative group/card flex-shrink-0 w-44 md:w-60 cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30">
      {/* Thumbnail Container */}
      <div
        onClick={() => setActiveModalTitle(title)}
        className="relative aspect-[16/9] md:aspect-[16/10] w-full rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md group-hover/card:border-zinc-600 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={title.backdropUrl || title.posterUrl}
          alt={title.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

        {/* Type Badge */}
        <span className="absolute top-2 left-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10 text-white">
          {title.type}
        </span>

        {/* Watch Progress Bar */}
        {showProgress && progress && progress.percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Quick Action Bar on Hover */}
      <div className="mt-2 flex items-center justify-between">
        <div className="overflow-hidden">
          <h3
            onClick={() => setActiveModalTitle(title)}
            className="text-xs md:text-sm font-semibold text-gray-200 truncate group-hover/card:text-white"
          >
            {title.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
            <span className="text-emerald-400 font-bold">{title.matchScore}%</span>
            <span>•</span>
            <span>{title.releaseYear}</span>
            <span>•</span>
            <span className="border border-zinc-700 px-1 rounded text-[9px]">{title.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0">
          <Link
            href={`/watch?titleId=${title.id}`}
            className="p-1.5 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
            title="Play"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </Link>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(title.id);
            }}
            className="p-1.5 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors border border-zinc-700"
            title={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveModalTitle(title);
            }}
            className="p-1.5 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors border border-zinc-700"
            title="More Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

