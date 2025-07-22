'use client'

import { useState, useEffect, useMemo } from 'react'

import { Plus, Edit, Trash2, Eye, ArrowDown, ArrowUp, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

// import { useRouter } from 'next/navigation' // Removed unused import
import { getAllNewsArticlesForAdmin, deleteNewsArticle } from '@/lib/firebase/newsUtils'
import type { NewsArticle } from '@/types/news'

export default function NewsAdminPage(): JSX.Element {
  // const router = useRouter() // Removed unused variable
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof NewsArticle>('publishedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Load articles on mount
  useEffect(() => {
    // Define async function inside useEffect
    const fetchArticles = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)
      try {
        const articlesData = await getAllNewsArticlesForAdmin()
        setArticles(articlesData)
        setFilteredArticles(articlesData)
      } catch (err) {
        console.error('Error loading articles:', err)
        setError('Failed to load articles')
      } finally {
        setIsLoading(false)
      }
    }
    
    void fetchArticles() // Call and explicitly ignore the promise
  }, [])
  
  // Filter articles when search term changes
  useEffect(() => {
    let filtered = articles;
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase()
      filtered = articles.filter(article => 
        article.title.toLowerCase().includes(searchTermLower) ||
        article.author.toLowerCase().includes(searchTermLower) ||
        article.excerpt.toLowerCase().includes(searchTermLower) ||
        (article.tags?.some(tag => tag.toLowerCase().includes(searchTermLower))) ||
        (article.category?.toLowerCase().includes(searchTermLower))
      )
    }
    setFilteredArticles(filtered)
  }, [searchTerm, articles])
  
  // Calculate the final sorted list using useMemo
  const sortedAndFilteredArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      
      if (sortField === 'publishedAt' || sortField === 'updatedAt') {
        const dateA = new Date(aValue as string).getTime()
        const dateB = new Date(bValue as string).getTime()
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })
  }, [filteredArticles, sortField, sortDirection])
  
  const handleSort = (field: keyof NewsArticle): void => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, set default to desc for dates, asc for other fields
      const isDateField = field === 'publishedAt' || field === 'updatedAt'
      setSortDirection(isDateField ? 'desc' : 'asc')
      setSortField(field)
    }
  }
  
  const handleDelete = async (id: string, title: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete the article "${title}"? This action cannot be undone.`)) {
      return
    }
    
    setIsDeleting(id)
    setError(null)
    setSuccess(null)
    
    try {
      await deleteNewsArticle(id)
      setArticles(articles.filter(article => article.id !== id))
      setSuccess(`Article "${title}" deleted successfully`)
    } catch (err) {
      console.error('Error deleting article:', err)
      setError('Failed to delete article')
    } finally {
      setIsDeleting(null)
    }
  }
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const SortIcon = ({ field }: { field: keyof NewsArticle }): JSX.Element | null => {
    if (sortField !== field) {
      return null
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="inline h-4 w-4 ml-1" /> 
      : <ArrowDown className="inline h-4 w-4 ml-1" />
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-800">News Articles</h1>
          <Link
            href="/admin/news/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Article
          </Link>
        </div>
        
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-600">
          <p>
            Manage all news articles for the Walking Golfer platform. From here you can create, edit, and delete articles, 
            as well as view performance metrics. Click on column headers to sort, or use the search box to filter articles.
          </p>
        </div>
      </header>
      
      {/* Status Messages */}
      {error && (
        <div className="p-4 mb-6 rounded-md bg-red-50 border border-red-100 text-red-700 flex items-center">
          <span className="font-medium">Error:</span>
          <span className="ml-2">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-6 rounded-md bg-green-50 border border-green-100 text-green-700 flex items-center">
          <span className="font-medium">Success:</span>
          <span className="ml-2">{success}</span>
        </div>
      )}
      
      {/* Search Box */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search articles by title, author, tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 font-medium">Loading articles...</span>
        </div>
      ) : sortedAndFilteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">
            {searchTerm 
              ? 'No articles match your search criteria.'
              : 'No articles have been created yet.'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/news/new"
              className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Your First Article
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      <span>Title</span>
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden md:table-cell"
                    onClick={() => handleSort('author')}
                  >
                    <div className="flex items-center">
                      <span>Author</span>
                      <SortIcon field="author" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell"
                    onClick={() => handleSort('publishedAt')}
                  >
                    <div className="flex items-center">
                      <span>Published</span>
                      <SortIcon field="publishedAt" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden xl:table-cell"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center">
                      <span>Updated</span>
                      <SortIcon field="updatedAt" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort('viewCount')}
                  >
                    <div className="flex items-center">
                      <span>Views</span>
                      <SortIcon field="viewCount" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredArticles.map(article => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span className="truncate max-w-xs sm:max-w-sm md:max-w-md">{article.title}</span>
                        {article.category && (
                          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                            {article.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {article.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                      {article.updatedAt ? formatDate(article.updatedAt) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.status === 'draft' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {article.status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {article.viewCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link 
                          href={`/news/${article.slug}`} 
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          target="_blank"
                          title="View article"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link 
                          href={`/admin/news/edit/${article.id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                          title="Edit article"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          title="Delete Article"
                          onClick={() => {
 void handleDelete(article.id, article.title); 
}}
                          className="text-red-600 hover:text-red-800 transition-colors p-1.5 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting === article.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 