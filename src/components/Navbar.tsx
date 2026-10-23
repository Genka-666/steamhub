'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown, Check, Film, Tv, ListPlus, ShieldCheck } from 'lucide-react';
import { useWatch } from '@/context/WatchContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { currentProfile, profiles, switchProfile, searchQuery, setSearchQuery } = useWatch();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 md:px-12 py-3 flex items-center justify-between ${
        isScrolled ? 'bg-zinc-950/95 backdrop-blur-md shadow-2xl border-b border-zinc-900' : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}
    >
      {/* Brand & Consumer Links */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            STREAMHUB
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded">
            4K
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="#anime" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-rose-400" />
            Anime & Series
          </Link>
          <Link href="#movies" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Film className="w-4 h-4 text-cyan-400" />
            Movies
          </Link>
          <Link href="#watchlist" className="hover:text-white transition-colors flex items-center gap-1.5">
            <ListPlus className="w-4 h-4 text-emerald-400" />
            My List
          </Link>
        </div>
      </div>

      {/* Right Consumer Controls */}
      <div className="flex items-center gap-4">
        {/* Instant Search Bar */}
        <div className="relative flex items-center">
          {showSearch ? (
            <div className="flex items-center bg-black/80 border border-zinc-700 rounded-full px-3 py-1.5 text-sm w-44 md:w-64 animate-in fade-in transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Titles, anime, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent border-none outline-none text-white text-xs w-full"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-white text-xs ml-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 text-gray-300 hover:text-white transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications Icon */}
        <button className="text-gray-300 hover:text-white transition-colors relative hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 group p-1 rounded hover:bg-white/10 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentProfile.avatar}
              alt={currentProfile.name}
              className="w-7 h-7 rounded-md object-cover border border-red-500/40"
            />
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-10 right-0 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-2 z-50 animate-in fade-in">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Switch Profile
              </p>
              <div className="space-y-1 my-1">
                {profiles.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      switchProfile(prof.id);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors ${
                      prof.id === currentProfile.id ? 'bg-red-600/20 text-white font-bold' : 'text-gray-300 hover:bg-white/10'
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

              {/* Admin Portal Gateway */}
              <div className="border-t border-zinc-800 mt-2 pt-2">
                <Link
                  href="/admin"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2 p-2 rounded text-xs text-amber-300/90 hover:bg-amber-500/10 transition-colors font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Portal</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
