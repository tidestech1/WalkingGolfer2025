'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { NewsArticle } from '@/types/news'

interface NewsSearchProps {
  articles: NewsArticle[]
  onFilteredArticles: (filtered: NewsArticle[]) => void
}

export default function NewsSearch({ articles, onFilteredArticles }: NewsSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    
    if (!term.trim()) {
      onFilteredArticles(articles)
      return
    }

    const searchLower = term.toLowerCase()
    const filtered = articles.filter(article => {
      // Search in title
      const titleMatch = article.title.toLowerCase().includes(searchLower)
      
      // Search in excerpt
      const excerptMatch = article.excerpt?.toLowerCase().includes(searchLower)
      
      // Search in content
      const contentMatch = article.content?.toLowerCase().includes(searchLower)
      
      // Search in author
      const authorMatch = article.author.toLowerCase().includes(searchLower)
      
      // Search in tags
      const tagsMatch = article.tags?.some(tag => 
        tag.toLowerCase().includes(searchLower)
      )
      
      // Search in category
      const categoryMatch = article.category?.toLowerCase().includes(searchLower)

      return titleMatch || excerptMatch || contentMatch || authorMatch || tagsMatch || categoryMatch
    })

    onFilteredArticles(filtered)
  }

  const clearSearch = () => {
    setSearchTerm('')
    onFilteredArticles(articles)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search articles by title, content, author, tags, or category..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      {searchTerm && (
        <div className="mt-3 text-sm text-gray-600">
          Searching for: <span className="font-medium text-gray-900">"{searchTerm}"</span>
        </div>
      )}
    </div>
  )
} 