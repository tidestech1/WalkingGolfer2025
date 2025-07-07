import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News and Articles | Walking Golfer',
  description: 'Stay updated with the latest news, articles, and insights about walkable golf courses, walking golf tips, equipment reviews, and industry trends across the USA.',
  keywords: ['golf news', 'walking golf articles', 'golf course news', 'golf tips', 'golf equipment reviews', 'golf industry news', 'walkable golf courses news'],
  openGraph: {
    title: 'News and Articles | Walking Golfer',
    description: 'Stay updated with the latest news, articles, and insights about walkable golf courses, golf tips, equipment reviews, and industry trends.',
    url: '/news',
    siteName: 'Walking Golfer',
    images: [
      {
        url: '/images/og-news.jpg',
        width: 1200,
        height: 630,
        alt: 'Walking Golfer News and Articles',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'News and Articles | Walking Golfer',
    description: 'Stay updated with the latest news, articles, and insights about walkable golf courses and tips.',
    images: ['/images/og-news.jpg'],
  },
  alternates: {
    canonical: '/news',
  },
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 