'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { GolfCourse } from '@/types/course'
import { useAuth } from '@/lib/hooks/useAuth'
import AdminProtectedRoute from '@/app/components/AdminProtectedRoute'
import CourseForm from '@/app/components/CourseForm'

export default function EditCoursePage(): JSX.Element {
  const params = useParams()
  const { getIdToken } = useAuth()
  const [course, setCourse] = useState<GolfCourse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id as string)
    }
  }, [params.id])

  const fetchCourse = async (courseId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No authentication token')

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Course not found')
        }
        throw new Error('Failed to fetch course')
      }

      const data = await response.json()
      setCourse(data.course)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch course')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AdminProtectedRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3357] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    )
  }

  if (error) {
    return (
      <AdminProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-800 text-lg font-semibold mb-2">Error</div>
            <div className="text-red-600">{error}</div>
            <button 
              onClick={() => fetchCourse(params.id as string)}
              className="mt-4 px-4 py-2 bg-[#0A3357] text-white rounded-md hover:bg-blue-900"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <CourseForm course={course} isEdit={true} />
    </AdminProtectedRoute>
  )
} 