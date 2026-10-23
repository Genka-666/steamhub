import type { Metadata } from 'next';
import './globals.css';
import { WatchProvider } from '@/context/WatchContext';

export const metadata: Metadata = {
  title: 'StreamHub — Watch Movies, Anime & Series in 4K ABR HLS',
  description: 'Next-generation video streaming platform architecture inspired by Netflix, Prime Video, Crunchyroll, and JioHotstar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black text-white antialiased">
      <body className="min-h-screen bg-zinc-950 text-gray-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <WatchProvider>{children}</WatchProvider>
      </body>
    </html>
  );
}
