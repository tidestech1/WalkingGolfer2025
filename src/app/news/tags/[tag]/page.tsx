import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'

import NewsCard from '@/app/components/NewsCard'
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema'
import { getNewsArticles } from '@/lib/firebase/newsUtils'
import type { NewsArticle } from '@/types/news'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  
  const title = `Articles tagged "${decodedTag}" | Walking Golfer`
  const description = `Read all articles tagged with "${decodedTag}" from Walking Golfer. Discover insights about walkable golf courses, walking golf tips, and more.`

  return {
    title,
    description,
    keywords: [decodedTag, 'golf articles', 'walking golf', 'golf tips', 'walkable golf courses'],
    openGraph: {
      title,
      description,
      url: `/news/tags/${tag}`,
      siteName: 'Walking Golfer',
      images: [
        {
          url: '/images/og-news.jpg',
          width: 1200,
          height: 630,
          alt: `Articles tagged ${decodedTag}`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/og-news.jpg'],
    },
    alternates: {
      canonical: `/news/tags/${tag}`,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  
  try {
    // Get articles filtered by this tag
    const articles = await getNewsArticles({ tag: decodedTag })
    
    if (articles.length === 0) {
      notFound()
    }

    // Create breadcrumb items
    const breadcrumbItems = [
      { name: 'Home', url: '/' },
      { name: 'News', url: '/news' },
      { name: `Tag: ${decodedTag}`, url: `/news/tags/${tag}` }
    ]

    return (
      <>
        <BreadcrumbSchema items={breadcrumbItems} />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back to News Button */}
            <div className="mb-6">
              <Link 
                href="/news" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
              </Link>
            </div>
            
            {/* Page Header */}
            <div className="flex items-center space-x-3 mb-4">
              <Tag className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Articles tagged "{decodedTag}"
              </h1>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <p className="text-gray-700">
                Found {articles.length} article{articles.length !== 1 ? 's' : ''} tagged with "{decodedTag}".
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading tag page:', error)
    notFound()
  }
} 