'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Info, Plus, Check, Volume2, VolumeX, Star } from 'lucide-react';
import { Title } from '@/types';
import { useWatch } from '@/context/WatchContext';

interface HeroBannerProps {
  title: Title;
}

export default function HeroBanner({ title }: HeroBannerProps) {
  const { setActiveModalTitle, isInWatchlist, toggleWatchlist } = useWatch();
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const inList = isInWatchlist(title.id);
  const clipSource = title.clipUrl || (title.type === 'movie' ? title.videoUrl : undefined);

  // Reset video loaded state when title changes
  useEffect(() => {
    setVideoLoaded(false);
  }, [title.id, clipSource]);

  // Synchronize audio mute state with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (videoRef.current) {
      videoRef.current.muted = nextState;
      if (!nextState) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="relative w-full h-[78vh] md:h-[90vh] bg-zinc-950 overflow-hidden select-none">
      {/* 1. Base Static Backdrop Artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out transform scale-100 hover:scale-105"
        style={{
          backgroundImage: `url(${title.backdropUrl || title.posterUrl})`,
        }}
      />

      {/* 2. Seamless Background Short Video Clip */}
      {clipSource && (
        <video
          ref={videoRef}
          key={clipSource}
          src={clipSource}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Deep Cinematic Vignette Gradients (Black & Charcoal) */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-full md:w-3/4 z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 to-transparent z-10 pointer-events-none" />

      {/* 4. Hero Content Info & Controls */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-12 max-w-3xl">
        {/* Dynamic Badges Row */}
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          {clipSource && videoLoaded && (
            <span className="text-[11px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold flex items-center gap-1.5 shadow-lg border border-emerald-500/40 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Clip Preview
            </span>
          )}

          <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md font-bold tracking-wider flex items-center gap-1">
            <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
            {title.matchScore}% Match
          </span>

          <span className="text-[11px] px-2 py-0.5 bg-zinc-900/80 text-zinc-300 border border-zinc-800 rounded-md font-semibold backdrop-blur-sm">
            {title.rating}
          </span>

          <span className="text-[11px] px-2 py-0.5 bg-zinc-900/80 text-zinc-300 border border-zinc-800 rounded-md font-semibold backdrop-blur-sm">
            {title.qualityBadge || '4K Ultra HD'}
          </span>

          <span className="text-[11px] px-2 py-0.5 bg-zinc-900/80 text-zinc-300 border border-zinc-800 rounded-md font-semibold backdrop-blur-sm">
            {title.audioBadge || 'Dolby Atmos'}
          </span>
        </div>

        {/* Title Heading */}
        <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight mb-3 drop-shadow-2xl leading-none">
          {title.title}
        </h1>

        {/* Synopsis */}
        <p className="text-zinc-300 text-sm md:text-base leading-relaxed line-clamp-3 mb-6 font-normal max-w-2xl text-shadow-md">
          {title.synopsis}
        </p>

        {/* Genre Badges */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {title.genres?.map((g) => (
            <span
              key={g}
              className="text-xs text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-800 transition-colors"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-3">
          <Link
            href={`/watch?titleId=${title.id}`}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-7 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2.5 transition-all duration-200 hover:scale-105 shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play Now</span>
          </Link>

          <button
            onClick={() => setActiveModalTitle(title)}
            className="bg-zinc-900/80 hover:bg-zinc-800 text-white px-5 md:px-6 py-3 rounded-xl font-semibold flex items-center gap-2 border border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <Info className="w-5 h-5 text-zinc-300" />
            <span>More Info</span>
          </button>

          <button
            onClick={() => toggleWatchlist(title.id)}
            className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md"
            title={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Floating Audio Mute/Unmute toggle */}
      {clipSource && (
        <button
          onClick={toggleSound}
          className="absolute bottom-20 right-6 md:right-12 z-20 p-3 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 text-white transition-all shadow-2xl backdrop-blur-xl hover:scale-110 active:scale-95"
          title={isMuted ? 'Unmute Clip Audio' : 'Mute Clip Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />}
        </button>
      )}
    </div>
  );
}
