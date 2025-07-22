import { format } from 'date-fns'
import { Calendar, User, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import type { NewsArticle } from '@/types/news'

interface NewsCardProps {
  article: NewsArticle
}

export default function NewsCard({ article }: NewsCardProps): JSX.Element {
  const placeholderImage = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-200 relative group">
      
      <Link href={`/news/${article.slug}`} className="block">
        <div className="relative w-full h-48">
          <Image 
            src={article.imageUrl || placeholderImage} 
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {article.category && (
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow">
                {article.category}
              </span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <Link href={`/news/${article.slug}`} className="block mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h2>
          
          <p className="text-sm text-gray-600 line-clamp-3 flex-grow">{article.excerpt}</p>
        </Link>
        
        <div className="flex flex-wrap items-center gap-y-2 text-xs text-gray-500 mt-auto border-t pt-3">
          <div className="flex items-center mr-4">
            <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <span>{article.author}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <span>
                {((): string => {
                    try {
                        return format(new Date(article.publishedAt), 'MMM d, yyyy');
                    } catch (e) {
                        console.error(`Invalid date format for article ${article.id}:`, article.publishedAt, e);
                        return 'Invalid Date';
                    }
                })()}
            </span>
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="w-full mt-3 flex items-start">
              <Tag className="h-3.5 w-3.5 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 3).map((tag) => (
                  <Link
                     key={tag}
                     href={`/news/tags/${tag}`}
                     className="text-blue-600 hover:underline"
                  >
                    #{tag}
                  </Link>
                ))}
                {article.tags.length > 3 && <span className="text-gray-400">+{article.tags.length - 3} more</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 