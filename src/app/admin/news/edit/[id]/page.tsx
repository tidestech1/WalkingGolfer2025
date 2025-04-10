'use client'

import { useState, useEffect } from 'react'

import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import NewsArticleForm from '@/app/components/NewsArticleForm'
import { getNewsArticleById } from '@/lib/firebase/newsUtils'
import type { NewsArticle } from '@/types/news'

export default function EditArticlePage(): JSX.Element {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadArticle = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const articleData = await getNewsArticleById(params.id)
        if (!articleData) {
          setError('Article not found')
          return
        }
        setArticle(articleData)
      } catch (err) {
        console.error('Error loading article:', err)
        setError('Failed to load article')
      } finally {
        setIsLoading(false)
      }
    }
    
    void loadArticle()
  }, [params.id])
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link 
        href="/admin/news" 
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Articles
      </Link>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Article</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading article...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-red-50 text-red-700">
            {error}
            <div className="mt-4">
              <button
                onClick={() => router.push('/admin/news')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Return to Articles List
              </button>
            </div>
          </div>
        ) : article ? (
          <NewsArticleForm article={article} isEdit={true} />
        ) : null}
      </div>
    </div>
  )
} 