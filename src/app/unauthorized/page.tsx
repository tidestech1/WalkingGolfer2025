import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-red-600 p-4 flex justify-center">
          <AlertTriangle className="h-16 w-16 text-white" />
        </div>
        
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page. This area is restricted to administrators only.
          </p>
          
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="px-4 py-2 bg-[#0A3357] text-white rounded-md hover:bg-[#0A3357]/90 transition-colors w-full"
            >
              Return to Home
            </Link>
            
            <Link
              href="/contact"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 