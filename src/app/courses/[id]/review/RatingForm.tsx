'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { Star, Upload, PlusCircle, MinusCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { User } from 'firebase/auth' // Import User type
import { getAuth, sendSignInLinkToEmail } from "firebase/auth"
import { auth as firebaseClientAuth } from "@/lib/firebase/firebase"
import Image from 'next/image'
import { z } from 'zod'
import { toast } from "sonner"; // Import toast

import ConditionsRating from '@/app/components/ConditionsRating'
import CostRating from '@/app/components/CostRating'
import DistanceRating from '@/app/components/DistanceRating'
import TerrainRating from '@/app/components/TerrainRating'
import { uploadReviewImages } from '@/lib/firebase/reviewUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { calculateWeightedWalkabilityRating } from '@/lib/utils/walkabilityRating'
import { GolfCourse } from '@/types/course'
// Removed CreateReviewInput, will use data matching API schemas

// Import the newly created modal
import { ReviewSubmitModal } from './ReviewSubmitModal'; 

// Define ReviewSubmitModal props (placeholder - will be created later)
// interface ReviewSubmitModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (email: string, name: string | undefined, displayType: string) => Promise<void>; 
//   reviewData: Record<string, any>; // The core review data from the form
// }

// Placeholder Modal Component (replace with actual implementation later)
// const ReviewSubmitModal: React.FC<ReviewSubmitModalProps> = ({ isOpen, onClose }) => {
//   if (!isOpen) return null;
//   return (
//     <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', border: '1px solid black', zIndex: 100 }}>
//       <h2>Enter Email & Display Preference</h2>
//       <p>(Modal Placeholder - Implementation needed)</p>
//       <button onClick={onClose}>Close</button>
//     </div>
//   );
// };

// Update props interface
interface RatingFormProps {
  course: GolfCourse; // Now expects a non-null course
  user: User | null;  // Expects user state from parent
}

// Zod schema for client-side form validation (mirrors authenticatedSubmitSchema)
const ratingFormSchema = z.object({
  // courseId is not part of the form data, it comes from props
  walkabilityRating: z.number().min(0).max(5), // Use calculated value later
  courseConditionRating: z.number().min(1, { message: "Condition rating is required." }).max(5),
  overallRating: z.number().min(1, { message: "Overall rating is required." }).max(5),
  hillinessRating: z.number().min(1, { message: "Terrain rating is required." }).max(5),
  accessibilityRating: z.number().min(1, { message: "Distance rating is required." }).max(5),
  lengthRating: z.number().min(1, { message: "Distance rating is required." }).max(5),
  costRating: z.number().min(1, { message: "Value rating is required." }).max(5),
  comment: z.string().optional(), // Made optional
  walkingDate: z.string().optional(), // Made optional
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  usedGolfCart: z.boolean(),
  usedPushCart: z.boolean(),
  cartExperience: z.string().optional(), // Keep optional in schema if API might use it later
});
type RatingFormData = z.infer<typeof ratingFormSchema>;

// Update component signature to use new props
export default function RatingForm({ course, user }: RatingFormProps) {
  const router = useRouter()
  const authHook = useAuth() // Rename to avoid conflict with firebaseClientAuth
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingReviewData, setPendingReviewData] = useState<Record<string, any> | null>(null)

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
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  // Add state for form errors
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

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

  // Handler for photo selection
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPhotos = [...photos, ...filesArray].slice(0, 8); // Limit to 8 photos
      setPhotos(newPhotos);

      // Generate previews
      const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoPreviews(newPreviews);
      
      // Revoke old previews to prevent memory leaks
      photoPreviews.forEach(url => URL.revokeObjectURL(url)); 
    }
  };

  // Handler for removing a photo
  const removePhoto = (indexToRemove: number) => {
      const newPhotos = photos.filter((_, index) => index !== indexToRemove);
      setPhotos(newPhotos);

      const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoPreviews(newPreviews);

      // Revoke old previews
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
  };

  // Update handleSubmit with Zod validation
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    
    if (!course) {
      toast.error('Course data is missing. Cannot submit review.');
      return;
    }

    // Extract raw data from state and form elements
    const commentElement = e.currentTarget.elements.namedItem('review') as HTMLTextAreaElement;
    const walkingDateElement = e.currentTarget.elements.namedItem('date-played') as HTMLInputElement;

    const rawFormData = {
        walkabilityRating: calculateWeightedWalkabilityRating({ terrain: terrainRating, distance: distanceRating, cost: costRating }) ?? 0,
        courseConditionRating: courseConditionRating,
        overallRating: overallRating,
        hillinessRating: terrainRating,
        accessibilityRating: distanceRating,
        lengthRating: distanceRating, 
        costRating: costRating,
        comment: commentElement?.value || undefined, // Use undefined for optional empty string
        walkingDate: walkingDateElement?.value || undefined, // Use undefined for optional empty string
        pros: pros.filter(pro => pro.trim()),
        cons: cons.filter(con => con.trim()),
        usedGolfCart: facilities.golfCarts,
        usedPushCart: facilities.pushCarts,
        cartExperience: undefined, // Set explicitly to undefined as field is removed
    };

    // Validate the raw data
    const validationResult = ratingFormSchema.safeParse(rawFormData);

    if (!validationResult.success) {
        console.error("Client-side validation failed:", validationResult.error.flatten());
        const formattedErrors: Record<string, string | undefined> = {};
        validationResult.error.errors.forEach(err => {
            if (err.path[0]) {
                formattedErrors[String(err.path[0])] = err.message;
            }
        });
        setFormErrors(formattedErrors);
        toast.error("Please fix the errors highlighted in the form.");
        return;
    }

    // --- Data is valid, proceed with submission --- 
    setIsSubmitting(true); 
    const validatedData = validationResult.data; // Use validated data

    // Explicitly handle date conversion to satisfy TypeScript
    const walkingDateISO = validatedData.walkingDate 
        ? new Date(validatedData.walkingDate).toISOString() 
        : undefined;

    const coreReviewData = {
        courseId: course.id,
        ...validatedData,
        walkingDate: walkingDateISO, // Use the converted date or undefined
        // Ensure pros/cons are properly filtered 
        pros: pros.filter(pro => pro.trim()),
        cons: cons.filter(con => con.trim()),
    };

    // --- Conditional Submission Logic --- 
    if (user) {
      // === AUTHENTICATED USER ===
      let finalReviewData = { ...coreReviewData, imageUrls: [] as string[] }; // Start with empty array
      const toastId = toast.loading("Submitting your review..."); // Start loading toast

      try {
        // 1. Upload images if present
        if (photos.length > 0) {
          console.log(`Uploading ${photos.length} images...`);
          const uploadResult = await uploadReviewImages(course.id, user.uid, photos);
          if (uploadResult.error) {
            throw new Error(`Image upload failed: ${uploadResult.error}`);
          }
          finalReviewData.imageUrls = uploadResult.urls;
          console.log('Image URLs:', uploadResult.urls);
          toast.loading("Uploading images...", { id: toastId }); // Update toast message during image upload
        }

        // 2. Get ID Token
        const idToken = await authHook.getIdToken();
        if (!idToken) {
          throw new Error('Could not get authentication token.');
        }

        // 3. Submit review data (including imageUrls)
        const response = await fetch('/api/reviews/submit-authenticated', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          // Send final data including image URLs
          body: JSON.stringify(finalReviewData), 
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        console.log('Authenticated review submitted:', result);
        toast.success("Review submitted successfully!", { id: toastId }); // Success toast
        router.push(`/courses/${course.id}?review_success=true`); 

      } catch (error: any) {
        console.error('Error submitting authenticated review:', error);
        toast.error(error.message || 'Failed to submit review.', { id: toastId }); // Error toast
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // === UNAUTHENTICATED USER ===
      // Store the data and open the modal
      console.log('User not logged in. Opening email/preference modal.');
      setPendingReviewData(coreReviewData);
      setIsModalOpen(true);
      setIsSubmitting(false); // Reset submit state as modal handles next step
    }
  };

  // Update handleModalSubmit
  const handleModalSubmit = async (email: string, name: string | undefined, displayType: string) => {
    if (!pendingReviewData) {
        toast.error('Missing review data. Please try submitting the form again.');
        return;
    }
    
    setIsSubmitting(true);
    setIsModalOpen(false);

    const fullDataForPending = {
        ...pendingReviewData,
        submittedEmail: email,
        submittedName: name,
        display_name_type: displayType,
    };

    const toastId = toast.loading("Saving review and sending verification link..."); // Loading toast

    try {
        // 1. Call backend
        const response = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullDataForPending),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }
        const { pendingReviewId, emailLink } = result;
        if (!pendingReviewId || !emailLink) {
          throw new Error('Backend did not return necessary verification data.');
        }
        console.log('Pending review saved, sending email...');
        toast.loading("Sending verification email...", { id: toastId }); // Update toast

        // 2. Save email locally
        window.localStorage.setItem('emailForSignIn', email);

        // 3. Send email (Client SDK)
        // Check if firebaseClientAuth is available
        if (!firebaseClientAuth) {
          throw new Error('Firebase authentication is not available. Cannot send verification email.');
        }
        
        // Correct env var access
        const frontendBaseUrl = process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'; 
        const continueUrl = `${frontendBaseUrl}/verify-email?reviewId=${pendingReviewId}`;
        const actionCodeSettings = {
            url: continueUrl,
            handleCodeInApp: true,
        };
        
        // Pass the checked firebaseClientAuth
        await sendSignInLinkToEmail(firebaseClientAuth, email, actionCodeSettings);
        
        // 4. Success
        setIsModalOpen(false);
        toast.success(`Verification link sent to ${email}. Please check your inbox!`, { id: toastId, duration: 6000 }); 
        router.push(`/courses/${course.id}?pending_review=true`);

    } catch (error: any) {
        console.error('Error submitting pending review or sending email:', error);
        toast.error(error.message || 'Failed to save review or send email.', { id: toastId });
    } finally {
        setIsSubmitting(false);
        setPendingReviewData(null);
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ADDED Confirming Course Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-2">
          <h2 className="text-xl font-semibold text-[#0A3357]">Confirming Course</h2>
          <p className="text-sm text-gray-600">
            {/* Access course prop directly */}
            {course.location_address1}, {course.location_city}, {course.location_state}
          </p>
      </div>

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
            <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
              {(hoveredTerrainRating || terrainRating) > 0
                ? (
                    {1: "Very flat and easy terrain", 2: "Gentle slopes, mostly flat", 3: "Moderate hills and terrain", 4: "Hilly with significant elevation changes", 5: "Very hilly and challenging terrain"}
                    [hoveredTerrainRating || terrainRating] || ''
                  )
                : 'Small mountains = flatter terrain'
              }
            </p>
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
            <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
              {(hoveredDistanceRating || distanceRating) > 0
                ? (
                    {1: "Very compact layout", 2: "Relatively compact", 3: "Average distances", 4: "Spread out layout", 5: "Very spread out"}
                    [hoveredDistanceRating || distanceRating] || ''
                  )
                : 'Small footprints = short distance'
              }
            </p>
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
            <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
              {(hoveredCostRating || costRating) > 0
                ? (
                    {1: "Budget-friendly pricing", 2: "Moderate pricing", 3: "Standard pricing", 4: "Premium pricing", 5: "Ultra-premium pricing"}
                    [hoveredCostRating || costRating] || ''
                  )
                : 'Larger $ icons mean higher pricing'
              }
            </p>
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
            <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
              {(hoveredConditionRating || courseConditionRating) > 0
                ? (
                    {1: "Poor conditions", 2: "Below average conditions", 3: "Average conditions", 4: "Good conditions", 5: "Excellent conditions"}
                    [hoveredConditionRating || courseConditionRating] || ''
                  )
                : 'Larger icons mean better maintained'
              }
            </p>
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
      {user && (
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Add Photos (Optional)</h3>
          <p className="text-sm text-gray-500">Share photos of the course conditions, views, or specific walking challenges (max 8 images).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photoPreviews.map((previewUrl, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                <Image
                  src={previewUrl}
                  alt={`Review photo preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button 
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {photos.length < 8 && (
              <label className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 text-center">Upload Photos</span>
                <input 
                  type="file"
                  multiple
                  accept="image/jpeg, image/png, image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Section 6: Pros & Cons */}
      <div className={`bg-white p-6 rounded-lg shadow-sm space-y-6 ${!isWalkable ? 'opacity-50' : ''}`}>
        <h2 className="text-xl font-semibold text-[#0A3357]">Pros & Cons</h2>
        
        {/* Pros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What did you like about walking this course?
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
            What were the challenges of walking this course?
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
            Your Review
          </label>
          <textarea
            id="review"
            name="review"
            rows={5}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${formErrors['comment'] ? 'border-red-500' : ''}`}
            placeholder="Share your detailed experience walking this course. What would other walking golfers want to know?"
          />
          {formErrors['comment'] && <p className="text-xs text-red-500 mt-1">{formErrors['comment']}</p>}
        </div>
      </div>

      {/* Date Played Input */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
         <label htmlFor="date-played" className="block text-sm font-medium text-gray-700 mb-1">
            Date Played
         </label>
         <input
            type="date"
            id="date-played"
            name="date-played"
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors['walkingDate'] ? 'border-red-500' : ''}`}
         />
         {formErrors['walkingDate'] && <p className="text-xs text-red-500 mt-1">{formErrors['walkingDate']}</p>}
      </div>

      {/* Submission Button and Error Message */}
      <button 
        type="submit" 
        disabled={isSubmitting || !isWalkable} // Disable if submitting or marked not walkable
        className="w-full py-3 px-4 bg-[#1A73E8] text-white rounded-md font-semibold hover:bg-[#1765C7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A73E8] disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>

      {/* Use the imported ReviewSubmitModal */}
      <ReviewSubmitModal 
         isOpen={isModalOpen}
         onClose={() => {
             setIsModalOpen(false);
             setPendingReviewData(null); // Clear pending data on close
         }}
         onSubmit={handleModalSubmit}
         reviewData={pendingReviewData || {}} // Pass pending data
       />
    </form>
  )
} 