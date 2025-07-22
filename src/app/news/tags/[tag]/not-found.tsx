import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TagNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tag Not Found</h1>
        <p className="text-gray-600 mb-8">
          We couldn&apos;t find any articles with this tag, or the tag doesn&apos;t exist.
        </p>
        <Link 
          href="/news"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </Link>
      </div>
    </div>
  )
} 