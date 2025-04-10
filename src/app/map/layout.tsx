'use client';

import MiniFooter from '@/app/components/MiniFooter';
import MiniHeader from '@/app/components/MiniHeader';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="sticky top-0 z-50 bg-white border-b">
        <MiniHeader />
      </div>
      <main className="h-[calc(100vh-40px)]">
        {children}
      </main>
      <div className="hidden lg:block">
        <MiniFooter />
      </div>
    </>
  );
} 