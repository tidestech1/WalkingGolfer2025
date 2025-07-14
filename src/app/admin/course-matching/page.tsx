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

  // Check if user is authorized
  const isAuthorized = user?.email && AUTHORIZED_USERS.includes(user.email)

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

  // Load CSV data and upload to Firebase
  const handleCsvUpload = useCallback(async () => {
    if (!csvText.trim()) return
    
    setIsUploading(true)
    try {
      const parsed = parseCsvData(csvText)
      
      // Upload to Firebase
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No auth token')

      const response = await fetch('/api/admin/course-matching/legacy-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          courses: parsed,
          sessionName: `Course Import ${new Date().toISOString().split('T')[0]}`
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Uploaded ${parsed.length} legacy courses`)
        
        // Reload data to get the new session
        window.location.reload()
      } else {
        throw new Error('Failed to upload courses')
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      alert('Error uploading CSV data. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [csvText, parseCsvData, getIdToken])

  // Search existing courses
  const searchCourses = useCallback(async (query: string, state?: string, city?: string) => {
    if (!query.trim() && !state && !city) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const response = await fetch('/api/courses/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchQuery: query,
          state: state,
          city: city,
          limit: 20
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.courses || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Auto-search when legacy course changes
  const currentLegacyCourse = legacyCourses[currentIndex]
  
  // Auto-search for current course
  const autoSearch = useCallback(() => {
    if (!currentLegacyCourse) return
    
    const searchTerm = currentLegacyCourse.courseName
    setSearchQuery(searchTerm)
    searchCourses(searchTerm, currentLegacyCourse.state, currentLegacyCourse.city)
  }, [currentLegacyCourse, searchCourses])

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

  // Load data from Firebase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true)
        const idToken = await getIdToken()
        if (!idToken) throw new Error('No auth token')

        // Load legacy courses and session info
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
  }, [getIdToken])

  // Update matching status in Firebase
  const updateMatchingStatus = useCallback(async (status: 'matched' | 'closed' | 'needs_review', matchedCourseId?: string, notes?: string) => {
    if (!sessionInfo) return

    try {
      const idToken = await getIdToken()
      if (!idToken) throw new Error('No auth token')

      const response = await fetch('/api/admin/course-matching/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          sessionId: sessionInfo.id,
          courseIndex: currentIndex,
          status,
          matchedCourseId,
          notes,
          processedByEmail: user?.email || 'unknown'
        })
      })

      if (response.ok) {
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
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status. Please try again.')
    }
  }, [sessionInfo, currentIndex, getIdToken, user])

  // Handle course selection for matching
  const handleCourseSelect = useCallback((course: GolfCourse) => {
    setSelectedCourse(course)
    setUpdateFields({
      courseName: course.courseName,
      club_name: course.club_name,
      location_city: course.location_city,
      location_state: course.location_state,
      club_type: course.club_type,
      twgReviewerNotes: currentLegacyCourse?.twgReviewerNotes || '',
      twgRating: currentLegacyCourse?.twgRating || '',
      walkabilityRating_overall: currentLegacyCourse?.walkabilityRating_overall || 0
    })
  }, [currentLegacyCourse])

  // Save course match with legacy data
  const saveCourseMatch = useCallback(async () => {
    if (!selectedCourse || !currentLegacyCourse) return
    
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
            courseName: updateFields.courseName,
            club_name: updateFields.club_name,
            location_city: updateFields.location_city,
            location_state: updateFields.location_state,
            club_type: updateFields.club_type,
            twgReviewerNotes: updateFields.twgReviewerNotes,
            twgRating: updateFields.twgRating,
            walkabilityRating_overall: updateFields.walkabilityRating_overall,
            dataSource: dataSource
          }
        })
      })

      if (response.ok) {
        await updateMatchingStatus('matched', selectedCourse.id)
        setSelectedCourse(null)
        alert('Course updated successfully!')
      } else {
        throw new Error('Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      alert('Error updating course. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }, [selectedCourse, currentLegacyCourse, updateFields, getIdToken, user, updateMatchingStatus])

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
              onClick={handleCsvUpload}
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
              Session: {sessionInfo.sessionName} • Uploaded by: {sessionInfo.uploadedBy} • {sessionInfo.totalCourses} courses
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
        <CardHeader>
          <CardTitle>
            Legacy Course #{currentIndex + 1} of {legacyCourses.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Course Name</Label>
              <p className="text-lg font-semibold">{currentLegacyCourse?.courseName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">City</Label>
              <p className="text-lg">{currentLegacyCourse?.city}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">State</Label>
              <p className="text-lg">{currentLegacyCourse?.state}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Type</Label>
              <p className="text-lg">{currentLegacyCourse?.type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">TWG Rating</Label>
              <p className="text-lg">{currentLegacyCourse?.twgRating}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Walkability Rating</Label>
              <p className="text-lg">{currentLegacyCourse?.walkabilityRating_overall}</p>
            </div>
          </div>
          {currentLegacyCourse?.twgReviewerNotes && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-500">TWG Reviewer Notes</Label>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{currentLegacyCourse.twgReviewerNotes}</p>
            </div>
          )}
          <div className="mt-4">
            <Button onClick={autoSearch} className="mr-2">
              <Search className="mr-2 h-4 w-4" />
              Auto Search
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${currentLegacyCourse?.courseName} golf course ${currentLegacyCourse?.city} ${currentLegacyCourse?.state}`)}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
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
              onClick={() => searchCourses(searchQuery, currentLegacyCourse?.state, currentLegacyCourse?.city)}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((course) => (
                <div 
                  key={course.id} 
                  className={`p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    selectedCourse?.id === course.id ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => handleCourseSelect(course)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{course.courseName}</p>
                      <p className="text-sm text-gray-500">
                        {course.club_name} • {course.location_city}, {course.location_state}
                      </p>
                      <p className="text-xs text-gray-400">
                        {course.club_type} • {course.course_holes} holes
                      </p>
                    </div>
                    {selectedCourse?.id === course.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <div className="flex gap-2">
            <Button 
              variant="destructive"
              onClick={() => updateMatchingStatus('closed')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Mark as Closed
            </Button>
            <Button 
              variant="outline"
              onClick={() => updateMatchingStatus('needs_review')}
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