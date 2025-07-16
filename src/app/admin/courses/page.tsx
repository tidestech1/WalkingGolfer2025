'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Edit, Trash2, ExternalLink, AlertCircle, MapPin, Globe, Phone } from 'lucide-react'
import { GolfCourse } from '@/types/course'
import AdminProtectedRoute from '@/app/components/AdminProtectedRoute'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function AdminCoursesPage(): JSX.Element {
  const [courses, setCourses] = useState<GolfCourse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('all')
  const [selectedClubType, setSelectedClubType] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInitialMessage, setShowInitialMessage] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  const router = useRouter()
  const { getIdToken } = useAuth()

  const searchCourses = async () => {
    // Only search if there's a search term or filter applied
    if (!searchQuery.trim() && (!selectedState || selectedState === 'all') && (!selectedClubType || selectedClubType === 'all')) {
      setError('Please enter a search term or select a filter to search courses.')
      return
    }

    setIsLoading(true)
    setError(null)
    setShowInitialMessage(false)
    setHasSearched(true)

    try {
      const idToken = await getIdToken()
      
      if (!idToken) {
        throw new Error('No authentication token available')
      }

      const searchBody = {
        searchQuery: searchQuery.trim() || undefined,
        state: selectedState && selectedState !== 'all' ? selectedState : undefined,
        clubType: selectedClubType && selectedClubType !== 'all' ? selectedClubType : undefined,
        limit: 1000 // Higher limit for admin use
      }

      const response = await fetch('/api/courses/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(searchBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCourses(data.courses || [])
    } catch (err) {
      console.error('Error searching courses:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    searchCourses()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCourses()
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedState('all')
    setSelectedClubType('all')
    setCourses([])
    setError(null)
    setShowInitialMessage(true)
    setHasSearched(false)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const idToken = await getIdToken()
      
      if (!idToken) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete course')
      }

      // Remove the course from the current list
      setCourses(courses.filter(course => course.id !== courseId))
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the course')
    }
  }

  const getStatsData = () => {
    const totalCourses = courses.length
    const walkableCourses = courses.filter(course => course.course_isWalkable === true).length
    const averageRating = courses.reduce((sum, course) => sum + (course.walkabilityRating_overall || 0), 0) / courses.length
    const stateGroups = courses.reduce((acc, course) => {
      acc[course.location_state] = (acc[course.location_state] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalCourses,
      walkableCourses,
      averageRating: averageRating.toFixed(1),
      stateGroups
    }
  }

  const stats = getStatsData()

  return (
    <AdminProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage golf courses in the Walking Golfer database</p>
          </div>
          <Button
            onClick={() => router.push('/admin/courses/new')}
            className="bg-[#0A3357] hover:bg-blue-900"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Course
          </Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Course List</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search courses, clubs, cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="AZ">Arizona</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedClubType} onValueChange={setSelectedClubType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                      <SelectItem value="Resort">Resort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-[#0A3357] hover:bg-blue-900"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                  <Button 
                    onClick={clearSearch}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                </div>
                
                {hasSearched && (
                  <div className="mt-4 text-sm text-gray-600">
                    {isLoading ? 'Searching...' : `Found ${courses.length} courses`}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Initial message */}
            {showInitialMessage && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Search to Find Courses</h3>
                    <p className="text-gray-600">
                      Use the search box above to find courses by name, city, or use the filters to browse by state or club type.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error message */}
            {error && (
              <Card className="mt-6 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Course results */}
            {!isLoading && !error && courses.length > 0 && (
              <div className="mt-6 space-y-2">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Column 1: Course Name and Basic Info */}
                        <div className="md:col-span-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {course.courseName || course.club_name || 'Unknown Course'}
                          </h3>
                          
                          {course.club_name && course.club_name !== course.courseName && (
                            <div className="text-sm text-gray-600 mb-1">{course.club_name}</div>
                          )}
                          
                          <div className="text-sm text-gray-600">
                            <div>{course.club_type}</div>
                            {course.course_holes && <div>{course.course_holes} holes</div>}
                            {course.walkabilityRating_overall && (
                              <div><strong>Walkability:</strong> {course.walkabilityRating_overall}</div>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Location and Contact Info */}
                        <div className="md:col-span-1">
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{course.location_city}, {course.location_state}</span>
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-1">
                            {course.contact_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{course.contact_phone}</span>
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
                        </div>

                        {/* Column 3: Action Buttons */}
                        <div className="md:col-span-1">
                          <div className="flex flex-col gap-2">
                            <Link href={`/courses/${course.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Course Page
                              </Button>
                            </Link>
                            <Button
                              onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteCourse(course.id)}
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No results message */}
            {!isLoading && !error && hasSearched && courses.length === 0 && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
                    <p className="text-gray-600">
                      No courses match your search criteria. Try adjusting your search terms or filters.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Walkable Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.walkableCourses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">States</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(stats.stateGroups).length}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Courses by State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.stateGroups)
                    .sort(([,a], [,b]) => b - a)
                    .map(([state, count]) => (
                      <div key={state} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{state}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminProtectedRoute>
  )
} 