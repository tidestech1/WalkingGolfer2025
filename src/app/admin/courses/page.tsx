'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, Eye, MapPin, Phone, Globe, Mail } from 'lucide-react'
import { GolfCourse } from '@/types/course'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAdmin } from '@/lib/hooks/useAdmin'
import AdminProtectedRoute from '@/app/components/AdminProtectedRoute'
import Link from 'next/link'

export default function AdminCoursesPage(): JSX.Element {
  const { user, getIdToken } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [courses, setCourses] = useState<GolfCourse[]>([])
  const [filteredCourses, setFilteredCourses] = useState<GolfCourse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedClubType, setSelectedClubType] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses()
  }, [])

  // Filter courses based on search and filters
  useEffect(() => {
    let filtered = courses

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course =>
        course.courseName.toLowerCase().includes(query) ||
        course.club_name.toLowerCase().includes(query) ||
        course.location_city.toLowerCase().includes(query) ||
        course.location_state.toLowerCase().includes(query)
      )
    }

    if (selectedState) {
      filtered = filtered.filter(course => course.location_state === selectedState)
    }

    if (selectedClubType) {
      filtered = filtered.filter(course => course.club_type === selectedClubType)
    }

    setFilteredCourses(filtered)
  }, [courses, searchQuery, selectedState, selectedClubType])

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No authentication token')

      const response = await fetch('/api/admin/courses/list', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No authentication token')

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete course')
      }

      // Remove course from local state
      setCourses(courses.filter(course => course.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
      alert(`Error deleting course: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get unique states and club types for filters
  const uniqueStates = [...new Set(courses.map(course => course.location_state))].sort()
  const uniqueClubTypes = [...new Set(courses.map(course => course.club_type))].sort()

  if (adminLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <AdminProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0A3357]">Course Management</h1>
            <p className="text-gray-600 mt-2">Manage golf courses in the Walking Golfer database</p>
          </div>
          <Link href="/admin/courses/new">
            <Button className="bg-[#0A3357] hover:bg-blue-900">
              <Plus className="mr-2 h-4 w-4" />
              Add New Course
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Course List</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Input
                      placeholder="Search courses, clubs, cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                    >
                      <option value="">All States</option>
                      {uniqueStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={selectedClubType}
                      onChange={(e) => setSelectedClubType(e.target.value)}
                      className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                    >
                      <option value="">All Types</option>
                      {uniqueClubTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <span>Total: {courses.length} courses</span>
                  <span>Filtered: {filteredCourses.length} courses</span>
                </div>
              </CardContent>
            </Card>

            {/* Course List */}
            {isLoading ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">Loading courses...</div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-red-500">Error: {error}</div>
                  <Button onClick={fetchCourses} className="mt-4 mx-auto block">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Course List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredCourses.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        {searchQuery || selectedState || selectedClubType 
                          ? 'No courses match your search criteria'
                          : 'No courses found'
                        }
                      </div>
                    ) : (
                      filteredCourses.map(course => (
                        <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{course.courseName}</h3>
                                <Badge variant="outline">{course.club_type}</Badge>
                                {course.course_isWalkable && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Walkable
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {course.location_city}, {course.location_state}
                                </div>
                                {course.contact_phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {course.contact_phone}
                                  </div>
                                )}
                                {course.contact_website && (
                                  <div className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    <a href={course.contact_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      Website
                                    </a>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span>Holes: {course.course_holes}</span>
                                <span>Par: {course.course_par}</span>
                                {course.walkabilityRating_overall && (
                                  <span>Rating: {course.walkabilityRating_overall.toFixed(1)}/5</span>
                                )}
                                <span>Reviews: {course.reviewCount || 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link href={`/courses/${course.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              <Link href={`/admin/courses/${course.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCourse(course.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0A3357]">{courses.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Walkable Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {courses.filter(c => c.course_isWalkable).length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {courses.length > 0 ? Math.round((courses.filter(c => c.course_isWalkable).length / courses.length) * 100) : 0}% of total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {courses.length > 0 && courses.some(c => c.walkabilityRating_overall) ? (
                      (courses.filter(c => c.walkabilityRating_overall).reduce((sum, c) => sum + (c.walkabilityRating_overall || 0), 0) / courses.filter(c => c.walkabilityRating_overall).length).toFixed(1)
                    ) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {courses.filter(c => c.walkabilityRating_overall).length} rated courses
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Courses by State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uniqueStates.map(state => {
                    const count = courses.filter(c => c.location_state === state).length
                    return (
                      <div key={state} className="flex justify-between items-center">
                        <span>{state}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminProtectedRoute>
  )
} 