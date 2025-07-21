'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, ArrowLeft, MapPin, Phone, Mail, Globe, Info } from 'lucide-react'
import { GolfCourse } from '@/types/course'
import { useAuth } from '@/lib/hooks/useAuth'

interface CourseFormProps {
  course?: GolfCourse | null
  isEdit?: boolean
  onSave?: (course: GolfCourse) => void
  onCancel?: () => void
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const CLUB_TYPES = ['Public', 'Private', 'Semi-Private', 'Resort', 'Military', 'Municipal']
const COURSE_TYPES = ['Championship', 'Executive', 'Par 3', 'Links', 'Resort', 'Municipal', 'Private']
const COURSE_CATEGORIES = ['Championship', 'Executive', 'Par 3', 'Links', 'Resort', 'Municipal']

export default function CourseForm({ course, isEdit = false, onSave, onCancel }: CourseFormProps): JSX.Element {
  const router = useRouter()
  const { getIdToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state - initialize with course data or defaults
  const [formData, setFormData] = useState<Partial<GolfCourse>>({
    // Basic Info
    courseName: course?.courseName || '',
    imageUrl: course?.imageUrl || '',
    
    // Contact Info
    contact_email: course?.contact_email || '',
    contact_phone: course?.contact_phone || '',
    contact_tollFreePhone: course?.contact_tollFreePhone || '',
    contact_website: course?.contact_website || '',
    
    // Course Details
    course_category: course?.course_category || '',
    course_description: course?.course_description || '',
    course_designer: course?.course_designer || '',
    course_holes: course?.course_holes || 18,
    course_tees: course?.course_tees || 4,
    course_type: course?.course_type || '',
    course_yearEstablished: course?.course_yearEstablished || new Date().getFullYear(),
    course_isWalkable: course?.course_isWalkable ?? null,
    course_par: course?.course_par || 72,
    course_guestPolicy: course?.course_guestPolicy || '',
    
    // Club Details
    club_totalHoles: course?.club_totalHoles || 18,
    club_name: course?.club_name || '',
    club_type: course?.club_type || '',
    
    // Location
    location_address1: course?.location_address1 || '',
    location_address2: course?.location_address2 || '',
    location_city: course?.location_city || '',
    location_coordinates_latitude: course?.location_coordinates_latitude || 0,
    location_coordinates_longitude: course?.location_coordinates_longitude || 0,
    location_country: course?.location_country || 'USA',
    location_state: course?.location_state || '',
    location_zip: course?.location_zip || '',
    
    // Facilities
    facilities_proShop: course?.facilities_proShop || false,
    facilities_restaurant: course?.facilities_restaurant || false,
    facilities_drivingRange: course?.facilities_drivingRange || false,
    facilities_puttingGreen: course?.facilities_puttingGreen || false,
    facilities_chippingGreen: course?.facilities_chippingGreen || false,
    facilities_practiceBunker: course?.facilities_practiceBunker || false,
    facilities_caddies: course?.facilities_caddies || false,
    facilities_clubRental: course?.facilities_clubRental || false,
    facilities_golfCarts: course?.facilities_golfCarts || false,
    facilities_pushCarts: course?.facilities_pushCarts || false,
    
    // Pricing
    course_weekdayCost: course?.course_weekdayCost || 0,
    course_weekendCost: course?.course_weekendCost || 0,
    course_twilightCost: course?.course_twilightCost || 0,
    
    // TWG specific fields
    twgRating: course?.twgRating || '',
    reviewerNotes: course?.reviewerNotes || '',
    twgReviewerNotes: course?.twgReviewerNotes || '',
  })

  const handleInputChange = (field: keyof GolfCourse, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!formData.courseName || !formData.club_name || !formData.location_city || !formData.location_state) {
        throw new Error('Please fill in all required fields')
      }

      const idToken = await getIdToken()
      if (!idToken) throw new Error('No authentication token')

      // Prepare the data to send
      const courseData = {
        ...formData,
        // Ensure required fields have defaults
        reviewCount: course?.reviewCount || 0,
        overallRatingSum: course?.overallRatingSum || 0,
        courseQualityRatingSum: course?.courseQualityRatingSum || 0,
        costRatingSum: course?.costRatingSum || 0,
        conditionRatingSum: course?.conditionRatingSum || 0,
        hillinessRatingSum: course?.hillinessRatingSum || 0,
        distanceRatingSum: course?.distanceRatingSum || 0,
        calculatedWeightedRatingSum: course?.calculatedWeightedRatingSum || 0,
        walkabilityRating_courseCondition: course?.walkabilityRating_courseCondition || null,
        walkabilityRating_courseQuality: course?.walkabilityRating_courseQuality || null,
        walkabilityRating_cost: course?.walkabilityRating_cost || null,
        walkabilityRating_hilliness: course?.walkabilityRating_hilliness || null,
        walkabilityRating_holeDistance: course?.walkabilityRating_holeDistance || null,
        walkabilityRating_overall: course?.walkabilityRating_overall || null,
        walkabilityRating_weightedRating: course?.walkabilityRating_weightedRating || null,
        lastRatingUpdate: course?.lastRatingUpdate || null,
        dataSource: course?.dataSource || `Admin-${new Date().toISOString().split('T')[0]}`
      }

      let response
      if (isEdit && course?.id) {
        // Update existing course
        response = await fetch(`/api/admin/courses/${course.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ updates: courseData })
        })
      } else {
        // Create new course
        response = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ course: courseData })
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save course')
      }

      const result = await response.json()
      setSuccess(isEdit ? 'Course updated successfully!' : 'Course created successfully!')
      
      if (onSave) {
        onSave(result.course || { ...courseData, id: result.id })
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/courses')
      }, 1500)

    } catch (error) {
      console.error('Error saving course:', error)
      setError(error instanceof Error ? error.message : 'Failed to save course')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => onCancel ? onCancel() : router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[#0A3357]">
            {isEdit ? 'Edit Course' : 'Add New Course'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Update course information' : 'Add a new golf course to the database'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800">{success}</div>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.courseName}
                  onChange={(e) => handleInputChange('courseName', e.target.value)}
                  placeholder="Enter course name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.club_name}
                  onChange={(e) => handleInputChange('club_name', e.target.value)}
                  placeholder="Enter club name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Type
                </label>
                <select
                  value={formData.club_type}
                  onChange={(e) => handleInputChange('club_type', e.target.value)}
                  className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                >
                  <option value="">Select club type</option>
                  {CLUB_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Type
                </label>
                <select
                  value={formData.course_type}
                  onChange={(e) => handleInputChange('course_type', e.target.value)}
                  className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                >
                  <option value="">Select course type</option>
                  {COURSE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Category
                </label>
                <select
                  value={formData.course_category}
                  onChange={(e) => handleInputChange('course_category', e.target.value)}
                  className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                >
                  <option value="">Select category</option>
                  {COURSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Description
              </label>
              <Textarea
                value={formData.course_description}
                onChange={(e) => handleInputChange('course_description', e.target.value)}
                placeholder="Enter course description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Course Details */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holes
                </label>
                <Input
                  type="number"
                  value={formData.course_holes}
                  onChange={(e) => handleInputChange('course_holes', parseInt(e.target.value) || 0)}
                  min="1"
                  max="36"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Holes (Club)
                </label>
                <Input
                  type="number"
                  value={formData.club_totalHoles}
                  onChange={(e) => handleInputChange('club_totalHoles', parseInt(e.target.value) || 0)}
                  min="1"
                  max="72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Par
                </label>
                <Input
                  type="number"
                  value={formData.course_par}
                  onChange={(e) => handleInputChange('course_par', parseInt(e.target.value) || 0)}
                  min="27"
                  max="144"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tees
                </label>
                <Input
                  type="number"
                  value={formData.course_tees}
                  onChange={(e) => handleInputChange('course_tees', parseInt(e.target.value) || 0)}
                  min="1"
                  max="8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Designer
                </label>
                <Input
                  value={formData.course_designer}
                  onChange={(e) => handleInputChange('course_designer', e.target.value)}
                  placeholder="Enter designer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Established
                </label>
                <Input
                  type="number"
                  value={formData.course_yearEstablished}
                  onChange={(e) => handleInputChange('course_yearEstablished', parseInt(e.target.value) || new Date().getFullYear())}
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is Walkable?
                </label>
                <select
                  value={formData.course_isWalkable === null || formData.course_isWalkable === undefined ? '' : formData.course_isWalkable.toString()}
                  onChange={(e) => handleInputChange('course_isWalkable', e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                >
                  <option value="">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Policy
                </label>
                <Input
                  value={formData.course_guestPolicy}
                  onChange={(e) => handleInputChange('course_guestPolicy', e.target.value)}
                  placeholder="Enter guest policy"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <Input
                value={formData.location_address1}
                onChange={(e) => handleInputChange('location_address1', e.target.value)}
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <Input
                value={formData.location_address2}
                onChange={(e) => handleInputChange('location_address2', e.target.value)}
                placeholder="Enter apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.location_city}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location_state}
                  onChange={(e) => handleInputChange('location_state', e.target.value)}
                  className="w-full h-9 px-3 py-1 border border-input rounded-md text-sm"
                  required
                >
                  <option value="">Select state</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <Input
                  value={formData.location_zip}
                  onChange={(e) => handleInputChange('location_zip', e.target.value)}
                  placeholder="Enter ZIP code"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Input
                  value={formData.location_country}
                  onChange={(e) => handleInputChange('location_country', e.target.value)}
                  placeholder="USA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.location_coordinates_latitude}
                  onChange={(e) => handleInputChange('location_coordinates_latitude', parseFloat(e.target.value) || 0)}
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.location_coordinates_longitude}
                  onChange={(e) => handleInputChange('location_coordinates_longitude', parseFloat(e.target.value) || 0)}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toll-Free Phone
                </label>
                <Input
                  value={formData.contact_tollFreePhone}
                  onChange={(e) => handleInputChange('contact_tollFreePhone', e.target.value)}
                  placeholder="Enter toll-free number"
                  type="tel"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <Input
                  value={formData.contact_website}
                  onChange={(e) => handleInputChange('contact_website', e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>Facilities & Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Main Facilities */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Main Facilities</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_proShop}
                      onChange={(e) => handleInputChange('facilities_proShop', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Pro Shop</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_restaurant}
                      onChange={(e) => handleInputChange('facilities_restaurant', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Restaurant</span>
                  </label>
                </div>
              </div>

              {/* Practice Areas */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Practice Areas</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_drivingRange}
                      onChange={(e) => handleInputChange('facilities_drivingRange', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Driving Range</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_puttingGreen}
                      onChange={(e) => handleInputChange('facilities_puttingGreen', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Putting Green</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_chippingGreen}
                      onChange={(e) => handleInputChange('facilities_chippingGreen', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Chipping Green</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_practiceBunker}
                      onChange={(e) => handleInputChange('facilities_practiceBunker', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Practice Bunker</span>
                  </label>
                </div>
              </div>

              {/* Rentals & Services */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Rentals & Services</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_caddies}
                      onChange={(e) => handleInputChange('facilities_caddies', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Caddies</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_clubRental}
                      onChange={(e) => handleInputChange('facilities_clubRental', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Club Rental</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_golfCarts}
                      onChange={(e) => handleInputChange('facilities_golfCarts', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Golf Carts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities_pushCarts}
                      onChange={(e) => handleInputChange('facilities_pushCarts', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Push Carts</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekday Cost ($)
                </label>
                <Input
                  type="number"
                  value={formData.course_weekdayCost}
                  onChange={(e) => handleInputChange('course_weekdayCost', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekend Cost ($)
                </label>
                <Input
                  type="number"
                  value={formData.course_weekendCost}
                  onChange={(e) => handleInputChange('course_weekendCost', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twilight Cost ($)
                </label>
                <Input
                  type="number"
                  value={formData.course_twilightCost}
                  onChange={(e) => handleInputChange('course_twilightCost', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TWG Specific - Reference Information (Read-Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Walking Golfer Information
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Reference data from original course import/matching. Not editable.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500">TWG Rating</label>
                <p className="text-sm font-medium">{formData.twgRating || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Overall Walkability</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_overall?.toFixed(1) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Course Quality</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_courseQuality?.toFixed(1) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Course Condition</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_courseCondition?.toFixed(1) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Cost Rating</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_cost?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Hilliness</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_hilliness?.toFixed(1) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Hole Distance</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_holeDistance?.toFixed(1) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Weighted Rating</label>
                <p className="text-sm font-medium">{formData.walkabilityRating_weightedRating?.toFixed(1) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Reviews</label>
                <p className="text-sm font-medium">{formData.reviewCount || 0}</p>
              </div>
            </div>
            {(formData.twgReviewerNotes || formData.reviewerNotes) && (
              <div className="border-t pt-4">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    View TWG Reviewer Notes
                  </summary>
                  <div className="mt-2 space-y-2">
                    {formData.twgReviewerNotes && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">TWG Reviewer Notes</label>
                        <p className="text-sm bg-gray-50 p-2 rounded-md">{formData.twgReviewerNotes}</p>
                      </div>
                    )}
                    {formData.reviewerNotes && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">General Reviewer Notes</label>
                        <p className="text-sm bg-gray-50 p-2 rounded-md">{formData.reviewerNotes}</p>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update History - Only show for existing courses */}
        {isEdit && course && (
          <Card>
            <CardContent className="pt-6">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Update History
                </summary>
                <div className="mt-4 space-y-3">
                  {course.updateHistory && course.updateHistory.length > 0 ? (
                    <div className="space-y-2">
                      {course.updateHistory.map((entry, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{entry.updatedBy}</div>
                          <div>{new Date(entry.updatedAt).toLocaleString()}</div>
                          {entry.changes && <div className="text-gray-500">{entry.changes}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No update history available</div>
                  )}
                  <div className="text-xs text-gray-400 border-t pt-2">
                    <div>Created: {new Date(course.createdAt).toLocaleString()}</div>
                    <div>Last updated: {new Date(course.updatedAt).toLocaleString()}</div>
                    {course.lastUpdatedBy && <div>Last updated by: {course.lastUpdatedBy}</div>}
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => onCancel ? onCancel() : router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0A3357] hover:bg-blue-900"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 