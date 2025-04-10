import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rate a Course | The Walking Golfer',
  description: 'Share your experience and rate the walkability of golf courses across the USA.',
}

export default function RateCourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
} 