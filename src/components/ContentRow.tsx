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
      {/* Row Header */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">{title}</h2>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
            {badge}
          </span>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-10 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 backdrop-blur-sm rounded-r"
            title="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Card Scroll Track */}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
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
            className="absolute right-0 top-0 bottom-0 z-30 w-10 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 backdrop-blur-sm rounded-l"
            title="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

