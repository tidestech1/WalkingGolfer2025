import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News and Articles | The Walking Golfer',
  description: 'Stay updated with the latest news, articles, and insights about walkable golf courses across the USA.',
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 