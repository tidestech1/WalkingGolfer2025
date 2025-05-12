import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Course Finder Map Search | Walking Golfer',
  description: 'Visually explore and find walkable golf courses across the USA using our interactive map. Discover courses by location and see details at a glance.',
  openGraph: {
    title: 'Course Finder Map Search | Walking Golfer',
    description: 'Visually explore and find walkable golf courses across the USA using our interactive map. Discover courses by location and see details at a glance.',
    url: '/map',
    images: [
      {
        url: '/images/og-map-search.png', // Replace with your actual OG image for map search
        width: 1200,
        height: 630,
        alt: 'Interactive map for finding walkable golf courses',
      },
    ],
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 