'use client'

import { useState } from 'react'

import Link from 'next/link'

import { verifyAdminStatus } from '@/lib/firebase/firebaseUtils'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AdminPage(): JSX.Element {
  const { user, getIdToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [tokenExpiration, setTokenExpiration] = useState<Date | null>(null)

  async function handleVerifyAdmin(): Promise<void> {
    try {
      setIsLoading(true)
      setMessage('')
      
      const idToken = await getIdToken();
      if (!idToken) {
        setMessage('Error: Unable to get authentication token');
        return;
      }
      
      const result = await verifyAdminStatus(idToken);
      
      if (result.success) {
        if (result.adminToken && result.expiration) {
          setAdminToken(result.adminToken);
          setTokenExpiration(result.expiration);
          setMessage('Admin verification successful! Temporary token issued.');
        } else {
          setMessage('Verification succeeded but token data is missing. Please try again.');
          console.error('Admin verification success with missing data:', result);
        }
      } else {
        setMessage(`Admin verification failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error during admin verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Please Sign In</h1>
            <p className="mt-2 text-gray-600">You need to sign in to access the admin dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          {/* Admin Authentication */}
          <div className="mb-8 p-4 border border-blue-100 rounded-lg bg-blue-50">
            <h2 className="text-xl font-semibold mb-2">Admin Authentication</h2>
            <p className="text-gray-700 mb-4">
              Verify your admin status to get a temporary token for admin operations. 
              The token is valid for 1 hour and required for sensitive operations.
            </p>
            
            <div className="mb-4">
              <button
                onClick={() => {
 void handleVerifyAdmin(); 
}}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Verify Admin Status
              </button>
            </div>
            
            {adminToken && (
              <div className="bg-white p-3 rounded border border-blue-200 mb-4">
                <p className="font-medium text-blue-800">Admin token issued</p>
                <p className="text-sm text-gray-600">
                  Valid until: {tokenExpiration?.toLocaleString() || 'Unknown'}
                </p>
              </div>
            )}
          </div>

          {/* Course Management */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Course Management</h2>
            <p className="text-gray-700 mb-4">
              Manage golf course data and content.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Course Database</h3>
                <p className="text-sm text-gray-600 mb-3">
                  View, edit, and manage all golf courses in the database.
                </p>
                <Link 
                  href="/admin/courses"
                  className="inline-block bg-[#0A3357] text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors"
                >
                  Manage Courses
                </Link>
              </div>
              <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Course Matching Tool</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Match legacy course data with existing courses in the database.
                </p>
                <Link 
                  href="/admin/course-matching"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open Course Matching Tool
                </Link>
              </div>
              <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Review Courses</h3>
                <p className="text-sm text-gray-600 mb-3">
                  View courses that need to be added to the database before matching.
                </p>
                <Link 
                  href="/admin/course-matching/review"
                  className="inline-block bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
                >
                  View Courses Needing Review
                </Link>
              </div>
            </div>
          </div>
          
          {/* News Management */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">News Management</h2>
            <p className="text-gray-700 mb-4">
              Manage news articles and content.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium mb-2">News Dashboard</h3>
                <p className="text-sm text-gray-600 mb-3">
                  View, edit, and manage all news articles in the system.
                </p>
                <Link 
                  href="/admin/news"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Manage News Articles
                </Link>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {message && (
            <div className="mt-6 p-4 rounded-md border border-gray-200 bg-gray-50">
              <p className="text-gray-800">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 