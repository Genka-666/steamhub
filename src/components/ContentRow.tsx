'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Title } from '@/types';
import ContentCard from './ContentCard';

interface ContentRowProps {
  id?: string;
  title: string;
  items: Title[];
  badge?: string;
  showProgress?: boolean;
}

export default function ContentRow({ id, title, items, badge, showProgress = true }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

      rowRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  const updateArrows = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  return (
    <div id={id} className="relative mb-8 md:mb-12 px-4 md:px-12 group/row select-none">
      {/* Category Row Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h2>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 backdrop-blur-sm">
              {badge}
            </span>
          )}
        </div>

        <span className="text-xs text-zinc-500 font-medium group-hover/row:text-zinc-400 transition-colors">
          {items.length} {items.length === 1 ? 'Title' : 'Titles'}
        </span>
      </div>

      {/* Horizontal Carousel Container */}
      <div className="relative group">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 md:-ml-4 z-30 p-2.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 backdrop-blur-md border border-zinc-800 shadow-2xl hover:scale-110 active:scale-95"
            title="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Card Scroll Track */}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex items-center gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <ContentCard key={item.id} title={item} showProgress={showProgress} />
          ))}
        </div>

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 md:-mr-4 z-30 p-2.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 backdrop-blur-md border border-zinc-800 shadow-2xl hover:scale-110 active:scale-95"
            title="Scroll Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
