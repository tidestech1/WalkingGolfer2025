import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Course Finder Text Search | Walking Golfer',
  description: 'Search for walkable golf courses by name, city, state, or other criteria. Find detailed information and reviews to plan your next round.',
  openGraph: {
    title: 'Course Finder Text Search | Walking Golfer',
    description: 'Search for walkable golf courses by name, city, state, or other criteria. Find detailed information and reviews to plan your next round.',
    url: '/search',
    images: [
      {
        url: '/images/og-text-search.png', // Replace with your actual OG image for text search
        width: 1200,
        height: 630,
        alt: 'Text search interface for finding walkable golf courses',
      },
    ],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 