'use client'

import { useState, useEffect } from 'react'

import { format } from 'date-fns'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'

import { getNewsArticleBySlug } from '@/lib/firebase/newsUtils'
import type { NewsArticle } from '@/types/news'


export default function ArticlePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    async function loadArticle() {
      if (!params?.slug) {
        setError(true)
        setLoading(false)
        return
      }
      
      try {
        const slug = params.slug.toString()
        const articleData = await getNewsArticleBySlug(slug)
        
        if (!articleData) {
          setError(true)
          return
        }
        
        setArticle(articleData)
        
        // Update metadata dynamically
        document.title = `${articleData.title} | The Walking Golfer`
      } catch (error) {
        console.error('Error loading article:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    
    loadArticle()
  }, [params?.slug])
  
  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Handle error or not found
  if (error || !article) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">We couldn&apos;t find the article you&apos;re looking for.</p>
          <button 
            onClick={() => router.push('/news')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <button 
          onClick={() => router.push('/news')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </button>
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
        <button 
          onClick={() => router.push('/news')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </button>
      </div>
    </main>
  )
} 