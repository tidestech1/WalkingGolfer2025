'use client'

import { useState, useEffect } from 'react'

import { Newspaper } from 'lucide-react'

import NewsCard from '@/app/components/NewsCard'
import { getNewsArticles } from '@/lib/firebase/newsUtils'
import type { NewsArticle } from '@/types/news'


export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadArticles() {
      try {
        const newsArticles = await getNewsArticles()
        setArticles(newsArticles)
      } catch (error) {
        console.error('Error loading news articles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Newspaper className="h-8 w-8 text-blue-600" />
            <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200 w-full"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Newspaper className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">News and Updates</h1>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <p className="text-gray-700 leading-relaxed">
              Stay up-to-date with the latest news, trends, and updates from the walking golf community. 
              Our articles cover course reviews, equipment recommendations, walking tips, and more to enhance your walking golf experience.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No articles available at the moment. Check back soon for updates!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-4">
          <Newspaper className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">News and Updates</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <p className="text-gray-700 leading-relaxed">
            Stay up-to-date with the latest news, trends, and updates from the walking golf community. 
            Our articles cover course reviews, equipment recommendations, walking tips, and more to enhance your walking golf experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
} 