'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function BackToMapButton(): JSX.Element | null {
  const searchParams = useSearchParams();
  const fromMap = searchParams.get('from') === 'map';
  const boundsParam = searchParams.get('bounds');
  const zoomParam = searchParams.get('zoom');
  const bounds = boundsParam ? JSON.parse(decodeURIComponent(boundsParam)) : null;

  if (!fromMap || !bounds) {
    return null;
  }

  let href = `/map?bounds=${encodeURIComponent(JSON.stringify(bounds))}`;
  if (zoomParam) {
    href += `&zoom=${zoomParam}`;
  }

  return (
    <div className="absolute top-4 left-4 z-30">
      <Button
        variant="outline"
        size="sm"
        className="bg-white/90 hover:bg-white text-gray-900 border-gray-200"
        asChild
      >
        <Link href={href}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search Results
        </Link>
      </Button>
    </div>
  );
} 