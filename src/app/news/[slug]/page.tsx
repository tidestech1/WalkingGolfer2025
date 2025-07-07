import { format } from 'date-fns'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import BackToNewsButton from '@/app/components/BackToNewsButton'
import SchemaMarkup from '@/app/components/SchemaMarkup'
import { getNewsArticleBySlug } from '@/lib/firebase/newsUtils'
import type { NewsArticle } from '@/types/news'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const article = await getNewsArticleBySlug(slug)
    
    if (!article) {
      return {
        title: 'Article Not Found | Walking Golfer',
        description: 'The requested article could not be found. Please return to our news section.',
      }
    }

    const title = article.metaTitle || `${article.title} | Walking Golfer`
    const description = article.metaDescription || article.excerpt || 'Read this article from Walking Golfer about walkable golf courses and walking golf tips.'
    const publishedDate = new Date(article.publishedAt).toISOString()
    const modifiedDate = article.updatedAt ? new Date(article.updatedAt).toISOString() : publishedDate

    return {
      title,
      description,
      keywords: article.tags || ['golf news', 'walkable golf courses', 'golf tips', 'golf equipment reviews', 'golf industry news'],
      authors: [{ name: article.author }],
      openGraph: {
        title,
        description,
        url: `/news/${slug}`,
        siteName: 'Walking Golfer',
        images: article.imageUrl ? [
          {
            url: article.imageUrl,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ] : [
          {
            url: '/images/og-news.jpg',
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        locale: 'en_US',
        type: 'article',
        publishedTime: publishedDate,
        modifiedTime: modifiedDate,
        authors: [article.author],
        tags: article.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [article.imageUrl || '/images/og-news.jpg'],
      },
      alternates: {
        canonical: `/news/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Article Not Found | Walking Golfer',
      description: 'The requested article could not be found. Please return to our news section.',
    }
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  
  try {
    const article = await getNewsArticleBySlug(slug)
    
    if (!article) {
      notFound()
    }

    return (
      <>
        <SchemaMarkup 
          type="article"
          title={article.title}
          description={article.excerpt}
          author={article.author}
          publishedAt={article.publishedAt}
          updatedAt={article.updatedAt}
          imageUrl={article.imageUrl}
          url={`/news/${slug}`}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <BackToNewsButton />
          </div>
          
          <article>
            {article.imageUrl && (
              <div className="relative h-[400px] w-full mb-8 rounded-lg overflow-hidden">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="prose prose-lg max-w-none">
              <h1 className="text-4xl font-bold text-[#0A3357] mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-gray-600 mb-8">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  <time dateTime={article.publishedAt}>
                    {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                  </time>
                </div>
                
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-400" />
                  <span>By {article.author}</span>
                </div>
                
                {article.source !== 'internal' && (
                  <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {article.source === 'stewart-golf' ? 'Stewart Golf' : 'Legacy'}
                  </span>
                )}
              </div>

              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
          
          <div className="mt-12 pt-8 border-t">
            <BackToNewsButton />
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error('Error loading article:', error)
    notFound()
  }
} 