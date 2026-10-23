'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Title, UserProfile, WatchProgress } from '@/types';
import { USER_PROFILES } from '@/lib/mockData';

interface WatchContextType {
  titles: Title[];
  loadingTitles: boolean;
  refreshTitles: () => Promise<void>;
  deleteTitle: (id: string) => Promise<boolean>;
  currentProfile: UserProfile;
  profiles: UserProfile[];
  switchProfile: (profileId: string) => void;
  watchlist: string[];
  toggleWatchlist: (titleId: string) => void;
  isInWatchlist: (titleId: string) => boolean;
  watchProgress: Record<string, WatchProgress>;
  updateWatchProgress: (titleId: string, currentTime: number, duration: number, episodeId?: string) => void;
  getProgress: (titleId: string, episodeId?: string) => WatchProgress | undefined;
  activeModalTitle: Title | null;
  setActiveModalTitle: (title: Title | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
}

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export function WatchProvider({ children }: { children: React.ReactNode }) {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loadingTitles, setLoadingTitles] = useState<boolean>(true);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(USER_PROFILES[0]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchProgress, setWatchProgress] = useState<Record<string, WatchProgress>>({});
  const [activeModalTitle, setActiveModalTitle] = useState<Title | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // 1. Fetch titles from SQLite backend API
  const refreshTitles = useCallback(async () => {
    try {
      setLoadingTitles(true);
      const res = await fetch('/api/titles');
      if (res.ok) {
        const data = await res.json();
        setTitles(data);
      }
    } catch (err) {
      console.error('Failed to load titles from backend:', err);
    } finally {
      setLoadingTitles(false);
    }
  }, []);

  useEffect(() => {
    refreshTitles();
  }, [refreshTitles]);

  // 2. Delete title via backend API
  const deleteTitle = async (id: string) => {
    try {
      const res = await fetch(`/api/titles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTitles((prev) => prev.filter((t) => t.id !== id));
        if (activeModalTitle?.id === id) {
          setActiveModalTitle(null);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete title:', err);
      return false;
    }
  };

  // 3. Load & sync watchlist and progress from SQLite & LocalStorage
  useEffect(() => {
    try {
      const savedProfileId = localStorage.getItem('streamhub_profile_id');
      if (savedProfileId) {
        const found = USER_PROFILES.find((p) => p.id === savedProfileId);
        if (found) setCurrentProfile(found);
      }

      const savedWatchlist = localStorage.getItem('streamhub_watchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }

      // Fetch progress from backend API
      fetch(`/api/progress?profileId=${savedProfileId || 'user-1'}`)
        .then((res) => res.json())
        .then((records) => {
          if (Array.isArray(records)) {
            const map: Record<string, WatchProgress> = {};
            records.forEach((rec) => {
              const key = rec.episodeId ? `${rec.titleId}_${rec.episodeId}` : rec.titleId;
              map[key] = {
                titleId: rec.titleId,
                episodeId: rec.episodeId || undefined,
                currentTime: rec.currentTime,
                duration: rec.duration,
                percentage: rec.percentage,
                lastWatchedAt: rec.lastWatchedAt,
              };
            });
            setWatchProgress(map);
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  const switchProfile = (profileId: string) => {
    const found = USER_PROFILES.find((p) => p.id === profileId);
    if (found) {
      setCurrentProfile(found);
      try {
        localStorage.setItem('streamhub_profile_id', found.id);
      } catch {}
    }
  };

  const toggleWatchlist = (titleId: string) => {
    setWatchlist((prev) => {
      const updated = prev.includes(titleId) ? prev.filter((id) => id !== titleId) : [...prev, titleId];
      try {
        localStorage.setItem('streamhub_watchlist', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isInWatchlist = (titleId: string) => watchlist.includes(titleId);

  const updateWatchProgress = (
    titleId: string,
    currentTime: number,
    duration: number,
    episodeId?: string
  ) => {
    if (!duration || duration <= 0) return;
    const key = episodeId ? `${titleId}_${episodeId}` : titleId;
    const percentage = Math.min(100, Math.round((currentTime / duration) * 100));

    // Optimistic state update
    setWatchProgress((prev) => ({
      ...prev,
      [key]: {
        titleId,
        episodeId,
        currentTime,
        duration,
        percentage,
        lastWatchedAt: new Date().toISOString(),
      },
    }));

    // Save to SQLite Backend API
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: currentProfile.id,
        titleId,
        episodeId,
        currentTime,
        duration,
      }),
    }).catch(() => {});
  };

  const getProgress = (titleId: string, episodeId?: string) => {
    const key = episodeId ? `${titleId}_${episodeId}` : titleId;
    return watchProgress[key];
  };

  return (
    <WatchContext.Provider
      value={{
        titles,
        loadingTitles,
        refreshTitles,
        deleteTitle,
        currentProfile,
        profiles: USER_PROFILES,
        switchProfile,
        watchlist,
        toggleWatchlist,
        isInWatchlist,
        watchProgress,
        updateWatchProgress,
        getProgress,
        activeModalTitle,
        setActiveModalTitle,
        searchQuery,
        setSearchQuery,
        showAddModal,
        setShowAddModal,
      }}
    >
      {children}
    </WatchContext.Provider>
  );
}

export function useWatch() {
  const context = useContext(WatchContext);
  if (!context) {
    throw new Error('useWatch must be used within a WatchProvider');
  }
  return context;
}
