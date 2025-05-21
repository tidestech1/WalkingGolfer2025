'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function BackToSearchButton(): JSX.Element | null {
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get('from') === 'search';

  // Build the search params to preserve
  const params = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'from') {
      params.append(key, value);
    }
  }
  const queryString = params.toString();
  const href = `/search${queryString ? `?${queryString}` : ''}`;

  if (!fromSearch) return null;

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