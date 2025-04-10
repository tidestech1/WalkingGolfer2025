'use client'

import { useState } from 'react'

import { Star, Upload, PlusCircle, MinusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import ConditionsRating from '@/app/components/ConditionsRating'
import CostRating from '@/app/components/CostRating'
import DistanceRating from '@/app/components/DistanceRating'
import TerrainRating from '@/app/components/TerrainRating'
import { createReview, uploadReviewImages } from '@/lib/firebase/reviewUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { calculateWeightedWalkabilityRating } from '@/lib/utils/walkabilityRating'
import type { GolfCourse } from '@/types/course'
import type { CreateReviewInput } from '@/types/review'

interface RatingFormProps {
  selectedCourse: GolfCourse | null;
}

export default function RatingForm({ selectedCourse }: RatingFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Walkability toggle state - default to true
  const [isWalkable, setIsWalkable] = useState<boolean>(true)
  
  // Overall rating state - ensure non-null values
  const [overallRating, setOverallRating] = useState<number>(0)
  const [hoveredOverallRating, setHoveredOverallRating] = useState<number>(0)
  
  // Component ratings state - ensure non-null values
  const [terrainRating, setTerrainRating] = useState<number>(0)
  const [hoveredTerrainRating, setHoveredTerrainRating] = useState<number>(0)
  
  const [distanceRating, setDistanceRating] = useState<number>(0)
  const [hoveredDistanceRating, setHoveredDistanceRating] = useState<number>(0)
  
  const [costRating, setCostRating] = useState<number>(0)
  const [hoveredCostRating, setHoveredCostRating] = useState<number>(0)

  // Course conditions state - ensure non-null values
  const [courseConditionRating, setCourseConditionRating] = useState<number>(0)
  const [hoveredConditionRating, setHoveredConditionRating] = useState<number>(0)

  // Facilities state
  const [facilities, setFacilities] = useState({
    proShop: false,
    barRestaurant: false,
    changingRoom: false,
    lockers: false,
    
    drivingRange: false,
    puttingGreen: false,
    chippingGreen: false,
    practiceBunker: false,
    
    caddies: false,
    clubRental: false,
    golfCarts: false,
    pushCarts: false
  })

  // Pros and Cons
  const [pros, setPros] = useState<string[]>([''])
  const [cons, setCons] = useState<string[]>([''])

  // Photos
  const [photos, setPhotos] = useState<File[]>([])

  // Handle walkability toggle
  const handleWalkabilityChange = (walkable: boolean) => {
    setIsWalkable(walkable)
    if (!walkable) {
      // Reset and lock ratings if course is not walkable
      setOverallRating(1)
      setTerrainRating(0)
      setDistanceRating(0)
      setCostRating(0)
      setPros([''])
      setCons([''])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      router.push('/login?redirect=/rate-course')
      return
    }

    if (!selectedCourse) {
      console.error('No course selected')
      return
    }

    setIsSubmitting(true)
    try {
      // Upload images first if any
      let imageUrls: string[] = []
      if (photos.length > 0) {
        const uploadResult = await uploadReviewImages(selectedCourse.id, user.uid, photos)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        imageUrls = uploadResult.urls
      }

      // Calculate weighted walkability rating with updated function signature
      const weightedRating = calculateWeightedWalkabilityRating({
        terrain: terrainRating,
        distance: distanceRating,
        cost: costRating
      })

      // Create review data with non-null values
      const reviewData: CreateReviewInput = {
        courseId: selectedCourse.id,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userPhotoUrl: user.photoURL || null,
        walkabilityRating: weightedRating ?? 0,
        courseConditionRating: courseConditionRating,
        overallRating: overallRating,
        hillinessRating: terrainRating,
        accessibilityRating: distanceRating,
        lengthRating: distanceRating,
        costRating: costRating,
        terrainRating: terrainRating,
        comment: (e.currentTarget.elements.namedItem('review') as HTMLTextAreaElement).value,
        walkingDate: new Date((e.currentTarget.elements.namedItem('date-played') as HTMLInputElement).value),
        pros: pros.filter(pro => pro.trim()),
        cons: cons.filter(con => con.trim()),
        imageUrls,
        usedGolfCart: facilities.golfCarts,
        usedPushCart: facilities.pushCarts
      }

      const result = await createReview(reviewData)
      if (!result.success) {
        throw new Error(result.error)
      }

      // Redirect to course page after successful submission
      router.push(`/courses/${selectedCourse.id}`)
    } catch (error) {
      console.error('Error submitting review:', error)
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper functions for pros/cons
  const addPro = () => setPros([...pros, ''])
  const removePro = (index: number) => setPros(pros.filter((_, i) => i !== index))
  const updatePro = (index: number, value: string) => {
    const newPros = [...pros]
    newPros[index] = value
    setPros(newPros)
  }

  const addCon = () => setCons([...cons, ''])
  const removeCon = (index: number) => setCons(cons.filter((_, i) => i !== index))
  const updateCon = (index: number, value: string) => {
    const newCons = [...cons]
    newCons[index] = value
    setCons(newCons)
  }

  // Star rating component
  const StarRating = ({ 
    rating, 
    hovered, 
    setRating, 
    setHovered, 
    size = 'md',
    descriptions,
    disabled = false
  }: { 
    rating: number, 
    hovered: number, 
    setRating: (r: number) => void, 
    setHovered: (r: number) => void,
    size?: 'sm' | 'md' | 'lg',
    descriptions?: Record<number, string>,
    disabled?: boolean
  }) => {
    const starSizes = {
      sm: 'w-6 h-6',
      md: 'w-7 h-7',
      lg: 'w-8 h-8'
    }

    return (
      <div className={disabled ? 'opacity-50' : ''}>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => !disabled && setRating(star)}
              onMouseEnter={() => !disabled && setHovered(star)}
              onMouseLeave={() => !disabled && setHovered(0)}
              className={`p-1 ${!disabled && 'hover:scale-110'} transition-transform`}
              disabled={disabled}
            >
              <Star
                className={`${starSizes[size]} ${
                  star <= (hovered || rating)
                    ? 'fill-[#FF9A00] text-[#FF9A00]'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {descriptions && rating > 0 && (
          <p className="mt-1 text-sm text-gray-500">{descriptions[rating]}</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 2: Overall Walkability Experience */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-[#0A3357]">Overall Walkability</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Is this course walkable? *
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="isWalkable"
                value="yes"
                checked={isWalkable === true}
                onChange={() => handleWalkabilityChange(true)}
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="isWalkable"
                value="no"
                checked={isWalkable === false}
                onChange={() => handleWalkabilityChange(false)}
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate the overall walkability of this course? *
          </label>
          <StarRating
            rating={isWalkable === false ? 1 : overallRating}
            hovered={hoveredOverallRating}
            setRating={setOverallRating}
            setHovered={setHoveredOverallRating}
            size="lg"
            disabled={isWalkable === false}
            descriptions={{
              1: "Very difficult to walk",
              2: "Challenging to walk",
              3: "Moderately walkable",
              4: "Good walkability",
              5: "Excellent walkability"
            }}
          />
        </div>
      </div>

      {/* Section 3: Detailed Walkability Metrics */}
      <div className={`bg-white p-6 rounded-lg shadow-sm space-y-6 ${!isWalkable ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#0A3357]">Detailed Walkability Ratings</h2>
          <p className="text-sm text-gray-600">
            Help other walking golfers by rating these key aspects of the course. Hover over each icon for more details.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terrain & Hilliness *
            </label>
            <TerrainRating
              rating={terrainRating}
              hovered={hoveredTerrainRating}
              setRating={setTerrainRating}
              setHovered={setHoveredTerrainRating}
              size="lg"
              descriptions={{
                1: "Very flat and easy terrain",
                2: "Gentle slopes, mostly flat",
                3: "Moderate hills and terrain",
                4: "Hilly with significant elevation changes",
                5: "Very hilly and challenging terrain"
              }}
            />
            {!terrainRating && !hoveredTerrainRating && (
              <p className="mt-1 text-sm text-gray-500">Small mountains = flatter terrain</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance Between Holes *
            </label>
            <DistanceRating
              rating={distanceRating}
              hovered={hoveredDistanceRating}
              setRating={setDistanceRating}
              setHovered={setHoveredDistanceRating}
              size="lg"
              descriptions={{
                1: "Very compact layout",
                2: "Relatively compact",
                3: "Average distances",
                4: "Spread out layout",
                5: "Very spread out"
              }}
            />
            {!distanceRating && !hoveredDistanceRating && (
              <p className="mt-1 text-sm text-gray-500">Small footprints = short distance</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Cost *
            </label>
            <CostRating
              rating={costRating}
              hovered={hoveredCostRating}
              setRating={setCostRating}
              setHovered={setHoveredCostRating}
              size="lg"
              descriptions={{
                1: "Budget-friendly pricing",
                2: "Moderate pricing",
                3: "Standard pricing",
                4: "Premium pricing",
                5: "Ultra-premium pricing"
              }}
            />
            {!costRating && !hoveredCostRating && (
              <p className="mt-1 text-sm text-gray-500">Larger $ icons mean higher pricing</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Conditions *
            </label>
            <ConditionsRating
              rating={courseConditionRating}
              hovered={hoveredConditionRating}
              setRating={setCourseConditionRating}
              setHovered={setHoveredConditionRating}
              size="lg"
              descriptions={{
                1: "Poor conditions",
                2: "Below average conditions",
                3: "Average conditions",
                4: "Good conditions",
                5: "Excellent conditions"
              }}
            />
            {!courseConditionRating && !hoveredConditionRating && (
              <p className="mt-1 text-sm text-gray-500">Larger icons mean better maintained</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Course Facilities */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#0A3357]">Course Facilities & Cart Options</h2>
          <p className="text-sm text-gray-600">
            Please select all the facilities and amenities available at this course.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            // Main facilities
            { id: 'proShop', label: 'Pro Shop' },
            { id: 'barRestaurant', label: 'Bar/Restaurant' },
            { id: 'changingRoom', label: 'Changing Room' },
            { id: 'lockers', label: 'Lockers' },

            // Practice areas
            { id: 'drivingRange', label: 'Driving Range' },
            { id: 'puttingGreen', label: 'Putting Green' },
            { id: 'chippingGreen', label: 'Chipping Green' },
            { id: 'practiceBunker', label: 'Practice Bunker' },

            // Rentals and services
            { id: 'caddies', label: 'Caddies' },
            { id: 'clubRental', label: 'Club Rental' },
            { id: 'golfCarts', label: 'Cart Rental (Ride-in)' },
            { id: 'pushCarts', label: 'Push/Pull Cart Rental' }
          ].map(({ id, label }) => (
            <div key={id} className="flex items-center">
              <input
                id={id}
                type="checkbox"
                checked={facilities[id as keyof typeof facilities]}
                onChange={(e) => setFacilities({...facilities, [id]: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={id} className="ml-3 text-sm text-gray-700">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Photos & Media */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-[#0A3357]">Course Photos</h2>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Add photos of the course (optional)
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Course photo ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {photos.length < 8 && (
              <label className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPhotos([...photos, e.target.files[0]])
                    }
                  }}
                />
              </label>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            Upload up to 8 photos. Each photo must be less than 5MB.
          </p>
        </div>
      </div>

      {/* Section 6: Pros & Cons */}
      <div className={`bg-white p-6 rounded-lg shadow-sm space-y-6 ${!isWalkable ? 'opacity-50' : ''}`}>
        <h2 className="text-xl font-semibold text-[#0A3357]">Pros & Cons</h2>
        
        {/* Pros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What did you like about walking this course? *
          </label>
          {pros.map((pro, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={pro}
                onChange={(e) => updatePro(index, e.target.value)}
                disabled={!isWalkable}
                placeholder="Enter a pro"
                className="flex-1 p-2 border rounded-md"
              />
              {index === pros.length - 1 ? (
                <button
                  type="button"
                  onClick={addPro}
                  disabled={!isWalkable}
                  className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => removePro(index)}
                  disabled={!isWalkable}
                  className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Cons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What were the challenges of walking this course? *
          </label>
          {cons.map((con, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={con}
                onChange={(e) => updateCon(index, e.target.value)}
                disabled={!isWalkable}
                placeholder="Enter a con"
                className="flex-1 p-2 border rounded-md"
              />
              {index === cons.length - 1 ? (
                <button
                  type="button"
                  onClick={addCon}
                  disabled={!isWalkable}
                  className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => removeCon(index)}
                  disabled={!isWalkable}
                  className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: Additional Comments */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#0A3357]">Additional Comments</h2>
        
        <div>
          <label htmlFor="review" className="block text-sm font-medium text-gray-700">
            Detailed Review *
          </label>
          <textarea
            id="review"
            name="review"
            rows={5}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your detailed experience walking this course. What would other walking golfers want to know?"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  )
} 