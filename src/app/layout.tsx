import type { Metadata } from 'next';
import './globals.css';
import { WatchProvider } from '@/context/WatchContext';

export const metadata: Metadata = {
  title: 'StreamHub Watcher — Watch Movies, Anime & Series in 4K ABR HLS',
  description: 'Production-ready video streaming platform with HLS adaptive bitrate delivery, custom posters, and background trailers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black text-white antialiased">
      <body className="min-h-screen bg-zinc-950 text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        <WatchProvider>{children}</WatchProvider>
      </body>
    </html>
  );
}
