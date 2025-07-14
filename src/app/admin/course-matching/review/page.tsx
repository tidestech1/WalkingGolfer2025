'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Plus, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface ReviewCourse {
  id: string
  sessionId: string
  courseIndex: number
  courseName: string
  type: string
  city: string
  state: string
  twgReviewerNotes: string
  twgRating: string
  walkabilityRating_overall: number
  processedBy: string
  processedByEmail: string
  processedAt: Date | string
}

export default function CourseReviewPage(): JSX.Element {
  const { user, getIdToken } = useAuth()
  const [reviewCourses, setReviewCourses] = useState<ReviewCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReviewCourses = async () => {
      try {
        setIsLoading(true)
        const idToken = await getIdToken()
        if (!idToken) throw new Error('No auth token')

        // Get all courses marked as "needs_review"
        const response = await fetch('/api/admin/course-matching/review-list', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          // Convert processedAt strings to Date objects
          const coursesWithDates = data.courses.map((course: any) => ({
            ...course,
            processedAt: typeof course.processedAt === 'string' ? new Date(course.processedAt) : course.processedAt
          }))
          setReviewCourses(coursesWithDates)
        }
      } catch (error) {
        console.error('Error loading review courses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReviewCourses()
  }, [getIdToken])

  // Helper function to safely format dates
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Loading Courses for Review...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading courses that need to be added to the database.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses Needing Database Addition</h1>
          <p className="text-gray-600 mt-2">
            These courses exist but aren't in our database yet. Add them manually, then return to matching.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/course-matching">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matching
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reviewCourses.length}</div>
            <div className="text-sm text-gray-600">Courses Need Addition</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(reviewCourses.map(c => c.state)).size}
            </div>
            <div className="text-sm text-gray-600">States Represented</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(reviewCourses.map(c => c.processedByEmail)).size}
            </div>
            <div className="text-sm text-gray-600">Team Members Involved</div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Add These Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Step-by-Step Process:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. <strong>Research Each Course:</strong> Use the Google Search link to gather complete course information</li>
              <li>2. <strong>Add to Database:</strong> Use Firebase console or admin tools to add the course with all required fields</li>
              <li>3. <strong>Return to Matching:</strong> Once added, go back to the matching tool and search for the newly added course</li>
              <li>4. <strong>Complete Match:</strong> Select the course and save the legacy data to complete the match</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>Courses to Add ({reviewCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewCourses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No courses marked for review yet.</p>
              <Link href="/admin/course-matching">
                <Button className="mt-4">
                  Start Course Matching
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewCourses.map((course) => (
                <div key={course.id} className="border rounded-md p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{course.courseName}</h3>
                      <p className="text-gray-600">
                        {course.city}, {course.state} • {course.type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${course.courseName} golf course ${course.city} ${course.state}`)}`, '_blank')}
                      >
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Research
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          // TODO: Add functionality to create new course
                          alert('Course creation form coming soon - for now, add manually to Firebase')
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Course
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-500">TWG Rating:</span>
                      <p className="font-medium">{course.twgRating}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Walkability:</span>
                      <p className="font-medium">{course.walkabilityRating_overall}/5</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Flagged By:</span>
                      <p className="font-medium">{course.processedByEmail}</p>
                    </div>
                  </div>
                  
                  {course.twgReviewerNotes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <span className="text-sm text-gray-500">TWG Reviewer Notes:</span>
                      <p className="text-sm mt-1">{course.twgReviewerNotes}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Flagged on {formatDate(course.processedAt)} at {formatTime(course.processedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 