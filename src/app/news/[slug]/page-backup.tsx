import { format } from 'date-fns'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import BackToNewsButton from '@/app/components/BackToNewsButton'
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema'
import SchemaMarkup from '@/app/components/SchemaMarkup'
import SocialShare from '@/app/components/SocialShare'
import ArticleNewsletterSignup from '@/app/components/ArticleNewsletterSignup'
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

    // Create breadcrumb items for this article
    const breadcrumbItems = [
      { name: 'Home', url: '/' },
      { name: 'News', url: '/news' },
      { name: article.title, url: `/news/${slug}` }
    ]

    return (
      <>
        <BreadcrumbSchema items={breadcrumbItems} />
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

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-gray-600 mb-6">
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

              {/* Social Sharing */}
              <div className="border-t border-b border-gray-200 py-4 mb-8">
                <SocialShare 
                  url={`/news/${slug}`}
                  title={article.title}
                  excerpt={article.excerpt}
                />
              </div>

              <div 
                className="prose prose-lg max-w-none [&_table]:border-collapse [&_table]:my-6 [&_table]:w-full [&_table]:border [&_table]:border-gray-200 [&_td]:border [&_td]:border-gray-200 [&_td]:px-4 [&_td]:py-3 [&_td]:text-left [&_th]:border [&_th]:border-gray-200 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:bg-gray-50 [&_th]:font-semibold [&_tr:nth-child(even)]:bg-gray-50 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-blue-900 [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:px-6 [&_pre]:py-4 [&_pre]:rounded-lg [&_pre]:my-6 [&_pre]:overflow-x-auto [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-gray-800 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_pre_code]:text-sm [&_hr]:border-none [&_hr]:border-t-2 [&_hr]:border-gray-200 [&_hr]:my-8 [&_img]:rounded-lg [&_img]:shadow-lg [&_img]:my-6 [&_h1]:text-[#0A3357] [&_h2]:text-[#0A3357] [&_h3]:text-[#0A3357] [&_h4]:text-[#0A3357] [&_h5]:text-[#0A3357] [&_h6]:text-[#0A3357]"
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

              {/* Bottom Social Sharing */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Share this article
                  </h3>
                  <SocialShare 
                    url={`/news/${slug}`}
                    title={article.title}
                    excerpt={article.excerpt}
                  />
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="mt-8">
                <ArticleNewsletterSignup />
              </div>
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