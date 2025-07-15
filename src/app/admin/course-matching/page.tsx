'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, ExternalLink, CheckCircle, XCircle, AlertCircle, Upload, Save } from 'lucide-react'
import { GolfCourse } from '@/types/course'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

// User whitelist for course matching tool
const AUTHORIZED_USERS = [
  'neilrossstewart@gmail.com',
  'neil@stewart.uk',
  'wgadmin@stewart.uk',
  'neil@tides.biz',
  'mark@stewartgolf.com',
  'mark@stewart.uk',
  'robrigg@me.com',
  'dave@stewartgolf.com',
  // Add more users as needed
];

// Legacy course data structure from CSV
interface LegacyCourse {
  courseName: string
  type: string // Military, Private, Public, Resort, Semi-private
  city: string
  state: string
  twgReviewerNotes: string
  twgRating: string
  walkabilityRating_overall: number
  originalIndex: number // Track position in original CSV
}

// Matching status for each legacy course
interface MatchingStatus {
  id: string
  sessionId: string
  courseIndex: number
  status: 'pending' | 'matched' | 'closed' | 'needs_review'
  matchedCourseId?: string
  notes?: string
  processedAt: Date
  processedBy: string
  processedByEmail: string
}

// Session info
interface SessionInfo {
  id: string
  sessionName: string
  uploadedBy: string
  uploadedAt: Date
  totalCourses: number
}

export default function CourseMatchingPage(): JSX.Element {
  const { user, getIdToken } = useAuth()
  const [legacyCourses, setLegacyCourses] = useState<LegacyCourse[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<GolfCourse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchStrategy, setSearchStrategy] = useState<string>('')
  const [matchingStatuses, setMatchingStatuses] = useState<Map<number, MatchingStatus>>(new Map())
  const [csvText, setCsvText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [updateFields, setUpdateFields] = useState({
    courseName: '',
    club_name: '',
    location_city: '',
    location_state: '',
    club_type: '',
    twgReviewerNotes: '',
    twgRating: '',
    walkabilityRating_overall: 0
  })

  // Parse CSV data
  const parseCsvData = useCallback((csvContent: string): LegacyCourse[] => {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []
    
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const courses: LegacyCourse[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      if (values.length >= 7) {
        courses.push({
          courseName: values[0] || '',
          type: values[1] || '',
          city: values[2] || '',
          state: values[3] || '',
          twgReviewerNotes: values[4] || '',
          twgRating: values[5] || '',
          walkabilityRating_overall: parseFloat(values[6]) || 0,
          originalIndex: i - 1
        })
      }
    }
    
    return courses
  }, [])

  // Upload CSV data
  const uploadCsvData = useCallback(async () => {
    if (!csvText.trim()) {
      alert('Please paste CSV data first')
      return
    }

    setIsUploading(true)
    try {
      const parsedCourses = parseCsvData(csvText)
      if (parsedCourses.length === 0) {
        alert('No valid courses found in CSV data')
        return
      }

      const idToken = await getIdToken()
      if (!idToken) throw new Error('No auth token')

      const response = await fetch('/api/admin/course-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          courses: parsedCourses,
          uploadedBy: user?.email || 'unknown'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLegacyCourses(parsedCourses)
        setSessionInfo(data.session)
        setCurrentIndex(0)
        setCsvText('')
        alert(`Successfully uploaded ${parsedCourses.length} courses`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }, [csvText, parseCsvData, getIdToken, user])

  // Progressive search with automatic fallback
  const searchCourses = useCallback(async (query: string, retryWithWords = false) => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchStrategy(retryWithWords ? 'Trying individual words...' : 'Searching full query...')

    try {
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No auth token')

      const response = await fetch('/api/courses/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          searchQuery: query.trim(),
          state: legacyCourses[currentIndex]?.state?.toUpperCase(),
          includeClubName: true,
          limit: 50
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.courses || []
      } else {
        const errorData = await response.json()
        console.error('Search error:', errorData)
        throw new Error(errorData.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }, [getIdToken])

    // Auto-search when navigating between courses
  useEffect(() => {
    const legacyCourse = legacyCourses[currentIndex]
    if (legacyCourse?.courseName) {
      const query = legacyCourse.courseName
      setSearchQuery(query)
      
      // Perform automatic search (full query only, no progressive search)
      const performAutoSearch = async () => {
        setIsSearching(true)
        setSearchStrategy('Searching...')
        
        try {
          const results = await searchCourses(query)
          setSearchResults(results)
          setSearchStrategy(results.length > 0 ? 'Search completed' : 'No results found')
        } catch (error) {
          console.error('Auto search error:', error)
          setSearchStrategy('Search failed')
        } finally {
          setIsSearching(false)
        }
      }
      
      performAutoSearch()
    }
  }, [currentIndex, legacyCourses, searchCourses])

  // Load data from existing session
  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      setIsLoadingData(true)
      try {
        const idToken = await getIdToken()
        if (!idToken) throw new Error('No auth token')

        const coursesResponse = await fetch('/api/admin/course-matching/legacy-courses', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        })
        
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          if (coursesData.courses.length > 0) {
            setLegacyCourses(coursesData.courses)
            setSessionInfo(coursesData.session)
            
            // Load progress for this session
            const progressResponse = await fetch(`/api/admin/course-matching/progress?sessionId=${coursesData.session.id}`, {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            })
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json()
              const progressMap = new Map<number, MatchingStatus>()
              
              Object.entries(progressData.progress).forEach(([index, status]) => {
                progressMap.set(parseInt(index), status as MatchingStatus)
              })
              
              setMatchingStatuses(progressMap)
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [getIdToken, user])

  // Update matching status in Firebase
  const updateMatchingStatus = useCallback(async (status: 'matched' | 'closed' | 'needs_review', matchedCourseId?: string, notes?: string) => {
    if (!sessionInfo) {
      console.error('No session info available')
      alert('Session information not available. Please refresh the page.')
      return
    }

    // Prevent multiple simultaneous updates
    if (isUpdating) {
      console.log('Update already in progress, skipping')
      return
    }

    try {
      setIsUpdating(true)
      console.log('Updating status:', { status, sessionId: sessionInfo.id, courseIndex: currentIndex })
      
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No auth token')

      const requestBody = {
        sessionId: sessionInfo.id,
        courseIndex: currentIndex,
        status,
        matchedCourseId,
        notes,
        processedByEmail: user?.email || 'unknown'
      }

      console.log('Request body:', requestBody)

      const response = await fetch('/api/admin/course-matching/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log('Success response:', responseData)
        
        const newStatus: MatchingStatus = {
          id: `${sessionInfo.id}-${currentIndex}`,
          sessionId: sessionInfo.id,
          courseIndex: currentIndex,
          status,
          matchedCourseId,
          notes,
          processedAt: new Date(),
          processedBy: user?.uid || 'unknown',
          processedByEmail: user?.email || 'unknown'
        }
        
        setMatchingStatuses(prev => new Map(prev.set(currentIndex, newStatus)))
        console.log('Status updated successfully')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`API Error: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert(`Error updating status: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsUpdating(false)
    }
  }, [sessionInfo, currentIndex, getIdToken, user, isUpdating])

  // Handle course selection for matching
  const handleCourseSelect = useCallback((course: GolfCourse) => {
    const legacyCourse = legacyCourses[currentIndex]
    setSelectedCourse(course)
    setUpdateFields({
      courseName: course.courseName,
      club_name: course.club_name,
      location_city: course.location_city,
      location_state: course.location_state,
      club_type: course.club_type,
      twgReviewerNotes: legacyCourse?.twgReviewerNotes || '',
      twgRating: legacyCourse?.twgRating || '',
      walkabilityRating_overall: legacyCourse?.walkabilityRating_overall || 0
    })
  }, [legacyCourses, currentIndex])

  // Save course match with legacy data
  const saveCourseMatch = useCallback(async () => {
    const legacyCourse = legacyCourses[currentIndex]
    if (!selectedCourse || !legacyCourse) return
    
    setIsUpdating(true)
    try {
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No auth token')

      const today = new Date().toISOString().split('T')[0]
      const dataSource = `TWG-human-matched-${today}`

      const response = await fetch('/api/admin/courses/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          updates: {
            twgReviewerNotes: updateFields.twgReviewerNotes,
            twgRating: updateFields.twgRating,
            walkabilityRating_overall: updateFields.walkabilityRating_overall,
            dataSource
          }
        })
      })

      if (response.ok) {
        await updateMatchingStatus('matched', selectedCourse.id, `Matched with ${selectedCourse.courseName}`)
        setSelectedCourse(null)
        
        // Move to next course
        if (currentIndex < legacyCourses.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save course match')
      }
    } catch (error) {
      console.error('Error saving course match:', error)
      alert(`Error saving course match: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUpdating(false)
    }
  }, [selectedCourse, legacyCourses, currentIndex, updateFields, getIdToken, updateMatchingStatus])

  // Handle manual search
  const handleManualSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setSearchStrategy('Searching...')
    
    try {
      const results = await searchCourses(searchQuery)
      setSearchResults(results)
      setSearchStrategy(results.length > 0 ? 'Search completed' : 'No results found')
    } catch (error) {
      console.error('Manual search error:', error)
      setSearchStrategy('Search failed')
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, searchCourses])

  // Check if user is authorized - moved after all hook calls
  const isAuthorized = user?.email && AUTHORIZED_USERS.includes(user.email)
  
  // Get current legacy course
  const currentLegacyCourse = legacyCourses[currentIndex]

  // Show unauthorized message if user is not authorized
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to access the course matching tool.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access the course matching tool.</p>
            <p className="text-sm text-gray-500 mt-2">
              Signed in as: {user.email}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Navigation
  const goToNext = () => {
    if (currentIndex < legacyCourses.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNextUnprocessed = () => {
    for (let i = currentIndex + 1; i < legacyCourses.length; i++) {
      if (!matchingStatuses.has(i)) {
        setCurrentIndex(i)
        return
      }
    }
    // If no unprocessed after current, start from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (!matchingStatuses.has(i)) {
        setCurrentIndex(i)
        return
      }
    }
  }

     // Auto search handled in the other useEffect above

  // Get progress stats
  const getProgress = () => {
    const total = legacyCourses.length
    const completed = Array.from(matchingStatuses.values()).filter(s => s.status !== 'pending').length
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 }
  }

  const progress = getProgress()

  // Show loading state
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Loading Course Matching Data...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we load your course matching session.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (legacyCourses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Course Matching Tool</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload Legacy Course Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Remove the last two columns (normalized_courseName and match_key) from your CSV</li>
                <li>2. Ensure the remaining columns are in this order: Course Name, Type, City, State, twgReviewerNotes, twgRating, walkabilityRating_overall</li>
                <li>3. Paste the CSV data below (including the header row)</li>
                <li>4. Click "Upload CSV Data" to start your matching session</li>
              </ol>
            </div>
            <div>
              <Label htmlFor="csv-data">Paste CSV Data</Label>
              <textarea
                id="csv-data"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste your CSV data here (including header row)..."
                className="w-full h-64 p-3 border rounded-md font-mono text-sm"
              />
            </div>
            <Button 
              onClick={uploadCsvData}
              disabled={!csvText.trim() || isUploading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading to Firebase...' : 'Upload CSV Data'}
            </Button>
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
          <h1 className="text-3xl font-bold">Course Matching Tool</h1>
          {sessionInfo && (
            <p className="text-sm text-gray-600 mt-1">
              Session: {sessionInfo.sessionName} • {sessionInfo.totalCourses} courses total
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {progress.completed} / {progress.total} completed ({progress.percentage.toFixed(1)}%)
          </Badge>
          <div className="flex gap-2">
            <Button 
              onClick={goToPrevious} 
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button 
              onClick={goToNext} 
              disabled={currentIndex === legacyCourses.length - 1}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
            <Button 
              onClick={goToNextUnprocessed}
              disabled={progress.completed === progress.total}
              size="sm"
            >
              Next Unprocessed
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Current Course */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Legacy Course #{currentIndex + 1} of {legacyCourses.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3">
            <div>
              <Label className="text-xs font-medium text-gray-500">Course Name</Label>
              <p className="text-sm font-semibold">{currentLegacyCourse?.courseName}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">City</Label>
              <p className="text-sm">{currentLegacyCourse?.city}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">State</Label>
              <p className="text-sm">{currentLegacyCourse?.state}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">Type</Label>
              <p className="text-sm">{currentLegacyCourse?.type}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">TWG Rating</Label>
              <p className="text-sm">{currentLegacyCourse?.twgRating}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">Walkability Rating</Label>
              <p className="text-sm">{currentLegacyCourse?.walkabilityRating_overall}</p>
            </div>
          </div>
          {currentLegacyCourse?.twgReviewerNotes && (
            <div className="mb-3">
              <Label className="text-xs font-medium text-gray-500">TWG Reviewer Notes</Label>
              <p className="text-xs bg-gray-50 p-2 rounded-md">{currentLegacyCourse.twgReviewerNotes}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleManualSearch} size="sm" className="text-xs">
              <Search className="mr-1 h-3 w-3" />
              Auto Search
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${currentLegacyCourse?.courseName} golf course ${currentLegacyCourse?.city} ${currentLegacyCourse?.state}`)}`, '_blank')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Google Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Existing Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="flex-1"
            />
            <Button 
              onClick={handleManualSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Smart Searching...' : 'Search'}
            </Button>
          </div>
          
          {isSearching && searchStrategy && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <Search className="inline h-4 w-4 mr-1" />
                {searchStrategy}
              </p>
            </div>
          )}
          
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 Smart Search Features:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• <strong>Auto-searches</strong> when you navigate to a new course</li>
              <li>• <strong>Searches both</strong> course names and club names</li>
              <li>• <strong>Prioritizes</strong> courses in <strong>{currentLegacyCourse?.state?.toUpperCase()}</strong> with green "✓ Target State" badges</li>
              <li>• <strong>Manual control:</strong> You choose the best search terms for nuanced matching</li>
              <li>• <strong>No results?</strong> See helpful suggestions below</li>
            </ul>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">
                Filtering for: {currentLegacyCourse?.state?.toUpperCase() || 'Unknown'} state courses first
              </div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} 
                {searchResults.length > 5 && ' (scroll to see more)'}
              </div>
              <div className="max-h-[32rem] overflow-y-auto space-y-2">
                {(() => {
                  // Filter and sort results: prioritize matching state
                  const targetState = currentLegacyCourse?.state?.toUpperCase() || ''
                  
                  const matchingState = searchResults.filter(course => 
                    course.location_state?.toUpperCase() === targetState
                  )
                  const otherStates = searchResults.filter(course => 
                    course.location_state?.toUpperCase() !== targetState
                  )
                  
                  const sortedResults = [...matchingState, ...otherStates]
                
                return sortedResults.map((course) => {
                  const isMatchingState = course.location_state?.toUpperCase() === targetState
                  
                  return (
                    <div 
                      key={course.id} 
                      className={`p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
                        selectedCourse?.id === course.id ? 'bg-blue-50 border-blue-300' : ''
                      } ${isMatchingState ? 'border-l-4 border-l-green-500' : ''}`}
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {/* Left Column: Course Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{course.courseName}</p>
                            {isMatchingState && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 shrink-0">
                                ✓ Target State
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            📍 {course.location_city}, {course.location_state}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {course.club_name} • {course.club_type} • {course.course_holes} holes
                          </p>
                        </div>

                        {/* Right Column: Contact Info */}
                        <div className="min-w-0 text-xs text-gray-500 space-y-1">
                          {course.location_address1 && (
                            <p className="truncate">
                              🏠 {course.location_address1}
                              {course.location_zip && `, ${course.location_zip}`}
                            </p>
                          )}
                          {course.contact_website && (
                            <p className="truncate">
                              🌐 <a href={course.contact_website} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                                {course.contact_website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                              </a>
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            {course.contact_phone && (
                              <span className="truncate">📞 {course.contact_phone}</span>
                            )}
                            <a 
                              href={`/courses/${course.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline shrink-0 ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🔗 View →
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      {selectedCourse?.id === course.id && (
                        <div className="mt-2 flex justify-center">
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
              </div>
            </div>
          ) : searchQuery.trim() && !isSearching ? (
            <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  No courses found for "{searchQuery}"
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-md border">
                <h4 className="font-medium text-gray-900 mb-2">💡 Try These Search Strategies:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Use fewer words:</strong> Try just "Aurora" instead of "Aurora Golf & Country Club"</li>
                  <li>• <strong>Try different keywords:</strong> Search for key parts like "Country Club"</li>
                  <li>• <strong>Check for renamed courses:</strong> Course might have a different name now</li>
                  <li>• <strong>Search club name:</strong> Try the facility name instead of course name</li>
                </ul>
              </div>
              

              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${searchQuery} golf course ${currentLegacyCourse?.city} ${currentLegacyCourse?.state}`)}`, '_blank')}
                  className="text-sm"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Search Google for "{searchQuery}"
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Course Edit Form */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={updateFields.courseName}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, courseName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="club_name">Club Name</Label>
                <Input
                  id="club_name"
                  value={updateFields.club_name}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, club_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="location_city">City</Label>
                <Input
                  id="location_city"
                  value={updateFields.location_city}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, location_city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="location_state">State</Label>
                <Input
                  id="location_state"
                  value={updateFields.location_state}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, location_state: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="club_type">Club Type</Label>
                <select
                  id="club_type"
                  value={updateFields.club_type}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, club_type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Type</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Resort">Resort</option>
                  <option value="Military">Military</option>
                </select>
              </div>
              <div>
                <Label htmlFor="twgRating">TWG Rating</Label>
                <Input
                  id="twgRating"
                  value={updateFields.twgRating}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, twgRating: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="walkabilityRating_overall">Walkability Rating</Label>
                <Input
                  id="walkabilityRating_overall"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={updateFields.walkabilityRating_overall}
                  onChange={(e) => setUpdateFields(prev => ({ ...prev, walkabilityRating_overall: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="twgReviewerNotes">TWG Reviewer Notes</Label>
              <textarea
                id="twgReviewerNotes"
                value={updateFields.twgReviewerNotes}
                onChange={(e) => setUpdateFields(prev => ({ ...prev, twgReviewerNotes: e.target.value }))}
                className="w-full p-3 border rounded-md"
                rows={3}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={saveCourseMatch}
                disabled={isUpdating}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? 'Updating...' : 'Save Match'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedCourse(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Action Guide:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Mark as Closed:</strong> Course is permanently closed/demolished</li>
              <li>• <strong>Needs Review:</strong> Course exists but not in our database yet</li>
              <li>• <strong>Match Course:</strong> Search found existing course - select it above</li>
            </ul>
          </div>
          
                      <div className="bg-amber-50 p-4 rounded-md mb-4">
            <h3 className="font-medium text-amber-900 mb-2">After "Needs Review":</h3>
            <ol className="text-sm text-amber-800 space-y-1">
              <li>1. Course will be flagged for manual addition to database</li>
              <li>2. Admin will add the course using course management tools</li>
              <li>3. Return to this tool to match with the newly added course</li>
            </ol>
            <div className="mt-3">
              <Link href="/admin/course-matching/review">
                <Button variant="outline" size="sm">
                  View All Courses Needing Review
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="destructive"
              onClick={() => void updateMatchingStatus('closed')}
              disabled={isUpdating}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Mark as Closed
            </Button>
            <Button 
              variant="outline"
              onClick={() => void updateMatchingStatus('needs_review')}
              disabled={isUpdating}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Needs Review
            </Button>
          </div>
          
          {/* Show current status */}
          {matchingStatuses.has(currentIndex) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Status: {matchingStatuses.get(currentIndex)?.status}</p>
              <p className="text-xs text-gray-500">
                Processed by: {matchingStatuses.get(currentIndex)?.processedByEmail} at {matchingStatuses.get(currentIndex)?.processedAt?.toLocaleString()}
              </p>
              {matchingStatuses.get(currentIndex)?.matchedCourseId && (
                <p className="text-xs text-gray-500">
                  Matched Course ID: {matchingStatuses.get(currentIndex)?.matchedCourseId}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 