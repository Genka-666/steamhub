'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  ChevronDown,
  Check,
  Film,
  Tv,
  ListPlus,
  ShieldCheck,
  Sparkles,
  Compass,
  X,
} from 'lucide-react';
import { useWatch } from '@/context/WatchContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { currentProfile, profiles, switchProfile, searchQuery, setSearchQuery } = useWatch();

  // Scroll background glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl/Cmd + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 px-4 md:px-12 py-3 flex items-center justify-between ${
        isScrolled
          ? 'bg-zinc-950/85 backdrop-blur-xl shadow-2xl border-b border-white/[0.06]'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}
    >
      {/* Brand & Main Category Links */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
            <span className="font-black text-white text-base tracking-tighter">S</span>
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            STREAM<span className="text-red-500">HUB</span>
          </span>
          <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
            4K HDR
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-semibold tracking-wide text-zinc-300">
          <Link
            href="/"
            className="hover:text-white transition-colors py-1 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            Discover
          </Link>
          <Link
            href="#anime"
            className="hover:text-white transition-colors py-1 flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5 text-rose-400" />
            Anime & Series
          </Link>
          <Link
            href="#movies"
            className="hover:text-white transition-colors py-1 flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            Movies
          </Link>
          <Link
            href="#watchlist"
            className="hover:text-white transition-colors py-1 flex items-center gap-1.5"
          >
            <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
            My List
          </Link>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Instant Interactive Search Bar */}
        <div className="relative flex items-center">
          {showSearch ? (
            <div className="flex items-center bg-zinc-900/90 border border-zinc-700/80 rounded-full px-3.5 py-1.5 text-sm w-52 md:w-72 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search anime, movies, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-zinc-500"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-zinc-400 hover:text-white p-0.5 rounded-full transition-colors"
                title="Close Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              title="Search (Ctrl + K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline-block text-[11px] text-zinc-400 border border-zinc-700/60 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </span>
            </button>
          )}
        </div>

        {/* Quick Admin Portal Button */}
        <Link
          href="/admin"
          className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm"
          title="Admin Control Center"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Admin</span>
        </Link>

        {/* Profile Avatar & Dropdown */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentProfile.avatar}
              alt={currentProfile.name}
              className="w-7 h-7 rounded-md object-cover border border-red-500/40 group-hover:border-red-500 transition-colors"
            />
            <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-white transition-transform duration-200" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-11 right-0 w-56 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 border-b border-zinc-800/80 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Current Profile
                </p>
                <p className="text-xs font-bold text-white truncate">{currentProfile.name}</p>
              </div>

              <div className="space-y-0.5 my-1">
                {profiles.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      switchProfile(prof.id);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      prof.id === currentProfile.id
                        ? 'bg-red-600/20 text-white font-semibold'
                        : 'text-zinc-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prof.avatar} alt={prof.name} className="w-6 h-6 rounded object-cover" />
                      <span>{prof.name}</span>
                    </div>
                    {prof.id === currentProfile.id && <Check className="w-3.5 h-3.5 text-red-500" />}
                  </button>
                ))}
              </div>

              {/* Admin Portal Gateway inside profile menu */}
              <div className="border-t border-zinc-800/80 mt-1 pt-1">
                <Link
                  href="/admin"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 transition-colors font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Control Center</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
