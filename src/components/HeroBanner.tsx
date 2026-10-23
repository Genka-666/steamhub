'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
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
    <div className="relative w-full h-[75vh] md:h-[88vh] bg-zinc-950 overflow-hidden select-none">
      {/* 1. Base Static Backdrop Artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
        style={{
          backgroundImage: `url(${title.backdropUrl || title.posterUrl})`,
        }}
      />

      {/* 2. Seamless Background Short Clip / Trailer Preview Video */}
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

      {/* 3. Dark Vignette Gradients for Legibility & Cinema Look */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent w-full md:w-3/4 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent z-10 pointer-events-none" />

      {/* 4. Hero Content Info & Controls */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-12 max-w-3xl">
        {/* Badges */}
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          {clipSource && videoLoaded && (
            <span className="text-[11px] px-2.5 py-0.5 bg-red-600/90 text-white rounded-full font-bold flex items-center gap-1.5 shadow-lg border border-red-500 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              Short Clip Playing
            </span>
          )}
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
          {title.genres?.map((g) => (
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

      {/* Clip Audio Mute/Unmute toggle */}
      {clipSource && (
        <button
          onClick={toggleSound}
          className="absolute bottom-20 right-6 md:right-12 z-20 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-gray-200 hover:text-white transition-all shadow-xl backdrop-blur-md hover:scale-110"
          title={isMuted ? 'Unmute Clip Audio' : 'Mute Clip Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-red-400" />}
        </button>
      )}
    </div>
  );
}
