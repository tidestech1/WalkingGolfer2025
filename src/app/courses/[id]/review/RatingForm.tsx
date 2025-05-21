'use client'

import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react'

import { User } from 'firebase/auth' // Import User type
import { getAuth, sendSignInLinkToEmail } from "firebase/auth"
import { Star, Upload, PlusCircle, MinusCircle, X, MapPin, HelpCircle } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from "sonner"; // Import toast
import { z } from 'zod'

import ConditionsRating from '@/app/components/ConditionsRating'
import CostRating from '@/app/components/CostRating'
import DistanceRating from '@/app/components/DistanceRating'
import TerrainRating from '@/app/components/TerrainRating'
import { auth as firebaseClientAuth } from "@/lib/firebase/firebase"
import { uploadReviewImages } from '@/lib/firebase/reviewUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { calculateWeightedWalkabilityRating } from '@/lib/utils/walkabilityRating'
import { GolfCourse } from '@/types/course'
// Removed CreateReviewInput, will use data matching API schemas

// Import the newly created modal
import { ReviewSubmitModal } from './ReviewSubmitModal'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

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
  isWalkable: z.boolean(), // Explicitly track walkability choice
  courseConditionRating: z.number().min(1, { message: "Condition rating is required." }).max(5),
  overallRating: z.number().min(1, { message: "Overall rating is required." }).max(5),
  hillinessRating: z.number().min(1, { message: "Terrain rating is required." }).max(5),
  distanceRating: z.number().min(1, { message: "Distance rating is required." }).max(5),
  costRating: z.number().min(1, { message: "Value rating is required." }).max(5),
  comment: z.string().optional(), // Made optional
  walkingDate: z.string().optional(), // Made optional
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
});
type RatingFormData = z.infer<typeof ratingFormSchema>;

// Update component signature to use new props
export default function RatingForm({ course, user }: RatingFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams() // Initialize useSearchParams
  const authHook = useAuth() // Rename to avoid conflict with firebaseClientAuth
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingReviewData, setPendingReviewData] = useState<Record<string, any> | null>(null)
  // --- Add state for verification message --- 
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>(''); // Store email for the message
  // --- End state add ---

  // Ref to prevent multiple submissions from useEffect
  const postLoginSubmitCalled = useRef(false);

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

  // Pros and Cons
  const [pros, setPros] = useState<string[]>([''])
  const [cons, setCons] = useState<string[]>([''])

  // Photos
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  // Add state for form errors
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  // --- Add useEffect to clear message on user change --- 
  useEffect(() => {
    // If user logs in/out, clear the verification message
    setShowVerificationMessage(false);
    setSubmittedEmail('');
    // Reset the ref if user changes, to allow potential new post-login submissions
    // if the user logs out and logs back in during the same session on this page.
    postLoginSubmitCalled.current = false;
  }, [user]);
  // --- End useEffect ---

  // --- START: Extracted Authenticated Submission Logic ---
  interface AuthenticatedReviewSubmitData {
    courseId: string;
    walkabilityRating: number;
    isWalkable: boolean;
    courseConditionRating: number;
    overallRating: number;
    hillinessRating: number;
    distanceRating: number;
    costRating: number;
    comment?: string | undefined; // Key optional, value can be string or undefined
    walkingDate?: string | undefined; // Key optional, value can be string or undefined (ISO string)
    pros: string[]; // Assuming pros/cons are always at least empty arrays from Zod
    cons: string[];
  }

  const handleAuthenticatedSubmitInternal = async (
    reviewData: AuthenticatedReviewSubmitData,
    photosToUpload: File[]
  ) => {
    if (!user) {
      toast.error("User not authenticated. Please log in.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your review...");

    try {
      const finalReviewData = { ...reviewData, imageUrls: [] as string[] };

      if (photosToUpload.length > 0) {
        console.log(`Uploading ${photosToUpload.length} images...`);
        toast.loading("Uploading images...", { id: toastId });
        const uploadResult = await uploadReviewImages(course.id, user.uid, photosToUpload);
        if (uploadResult.error) {
          throw new Error(`Image upload failed: ${uploadResult.error}`);
        }
        finalReviewData.imageUrls = uploadResult.urls;
        console.log('Image URLs:', uploadResult.urls);
      }

      const idToken = await authHook.getIdToken();
      if (!idToken) {
        throw new Error('Could not get authentication token.');
      }

      const response = await fetch('/api/reviews/submit-authenticated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(finalReviewData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Authenticated review submitted:', result);
      toast.success("Review submitted successfully!", { id: toastId });
      router.push(`/courses/${course.id}?review_success=true`);
    } catch (error: any) {
      console.error('Error submitting authenticated review:', error);
      toast.error(error.message || 'Failed to submit review.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- END: Extracted Authenticated Submission Logic ---

  // --- START: useEffect for Post-Login Submission ---
  useEffect(() => {
    const attemptPostLoginSubmission = async () => {
      if (postLoginSubmitCalled.current) return; // Already attempted or in progress

      const afterLogin = searchParams.get('afterLogin');
      // Ensure user is now logged in and the flag is present, and initial auth check is complete
      if (user && !authHook.loading && afterLogin === 'true') {
        const pendingDataJSON = sessionStorage.getItem('pendingReviewDataForLogin');
        const pendingCourseId = sessionStorage.getItem('pendingReviewCourseId');

        if (pendingDataJSON && pendingCourseId) {
          // Mark that we are attempting this submission.
          postLoginSubmitCalled.current = true;

          // Immediately remove from session storage to prevent re-attempts on error/reload
          sessionStorage.removeItem('pendingReviewDataForLogin');
          sessionStorage.removeItem('pendingReviewCourseId');

          // Since File objects cannot be stored in sessionStorage,
          // any photos selected before login are not available.
          // Clear any potentially stale photo state from before login and inform user.
          if (photos.length > 0 || photoPreviews.length > 0) {
            setPhotos([]);
            setPhotoPreviews([]);
            toast.info("Photos selected before login were not carried over. Please re-select them if desired.");
          }

          // Validate course context first
          if (!course || !course.id) {
            console.warn("Post-login submission: Course data not yet available or course ID missing.");
            toast.error("Could not submit pending review: course information is missing. Please try again.");
            postLoginSubmitCalled.current = false; // Allow retry when course data is available
             // Clean up URL even if there's an early exit due to missing course data
            if (router && searchParams.get('afterLogin')) { // Check router existence
                // Attempt to clean up URL, but without course.id, redirect to a safe page or root
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete('afterLogin');
                router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
            }
            return;
          }
          
          if (course.id !== pendingCourseId) {
            toast.error("Review course ID mismatch after login. Please submit your review on the correct course page.");
            // Clean up URL, redirecting to the *current* (potentially mismatched) course's review page
            router.replace(`/courses/${course.id}/review`, { scroll: false });
            return;
          }

          try {
            const storedFullData = JSON.parse(pendingDataJSON);
            const dataForAuthSubmit: AuthenticatedReviewSubmitData = {
              courseId: storedFullData.courseId || course.id,
              walkabilityRating: storedFullData.walkabilityRating,
              isWalkable: storedFullData.isWalkable,
              courseConditionRating: storedFullData.courseConditionRating,
              overallRating: storedFullData.overallRating,
              hillinessRating: storedFullData.hillinessRating,
              distanceRating: storedFullData.distanceRating,
              costRating: storedFullData.costRating,
              comment: storedFullData.comment,
              walkingDate: storedFullData.walkingDate,
              pros: storedFullData.pros || [],
              cons: storedFullData.cons || [],
            };

            await handleAuthenticatedSubmitInternal(dataForAuthSubmit, []); // Photos are intentionally empty
            // Navigation on success is handled by handleAuthenticatedSubmitInternal
          } catch (e) {
            console.error("Error processing or submitting pending review data after login:", e);
            toast.error("Could not submit pending review data. Please check your inputs and try again.");
            // Data is cleared from session storage, so user has to manually retry.
            // URL cleanup happens in the finally block.
          } finally {
            // Always clean up the URL query parameter if it's still present.
            // This ensures it's cleaned even if handleAuthenticatedSubmitInternal doesn't navigate (e.g. on error)
            if (router && course && course.id && searchParams.get('afterLogin')) { // Check router & course.id again
                 router.replace(`/courses/${course.id}/review`, { scroll: false });
            } else if (router && searchParams.get('afterLogin')) {
                // Fallback URL cleanup if course.id was somehow lost
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete('afterLogin');
                router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
            }
          }
        } else if (afterLogin === 'true') {
          // If afterLogin is true but no data in session, it was already processed or cleared.
          // Just clean up the URL.
          if (router && course && course.id) {
            router.replace(`/courses/${course.id}/review`, { scroll: false });
          } else if (router) {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete('afterLogin');
            router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
          }
        }
      }
    };

    if (!authHook.loading) { // Only run logic once auth state is resolved
        if (user && searchParams.get('afterLogin') === 'true') {
            attemptPostLoginSubmission();
        } else if (!user && searchParams.get('afterLogin') === 'true') {
            // User is not logged in, but afterLogin is true (e.g., navigated back after login attempt failed or logged out)
            // Clear the flag from URL and any stale session data
            if (sessionStorage.getItem('pendingReviewDataForLogin')) {
                sessionStorage.removeItem('pendingReviewDataForLogin');
                sessionStorage.removeItem('pendingReviewCourseId');
            }
            if (router) { // Check router existence
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete('afterLogin');
                // Try to use window.location.pathname if course.id is not available for a full path
                const currentPath = (course && course.id) ? `/courses/${course.id}/review` : window.location.pathname;
                router.replace(`${currentPath}?${newSearchParams.toString()}`, { scroll: false });
            }
        }
    }
  }, [user, authHook, searchParams, course, router, photos, photoPreviews]); // Updated dependencies
  // --- END: useEffect for Post-Login Submission ---

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
        walkabilityRating: calculateWeightedWalkabilityRating({
            terrain: terrainRating > 0 ? 6 - terrainRating : 0, // Invert terrain for calculation if rated
            distance: distanceRating > 0 ? 6 - distanceRating : 0, // Invert distance for calculation if rated
            cost: costRating
        }) ?? 0,
        isWalkable: isWalkable,
        courseConditionRating: courseConditionRating,
        overallRating: overallRating,
        hillinessRating: terrainRating > 0 ? 6 - terrainRating : 0, // Invert for submission if rated, else 0
        distanceRating: distanceRating > 0 ? 6 - distanceRating : 0, // Invert for submission if rated, else 0
        costRating: costRating,
        comment: commentElement?.value || undefined, // Use undefined for optional empty string
        walkingDate: walkingDateElement?.value || undefined, // Use undefined for optional empty string
        pros: pros.filter(pro => pro.trim()),
        cons: cons.filter(con => con.trim()),
    };

    // Validate the raw data
    const validationResult = ratingFormSchema.safeParse(rawFormData);

    if (!validationResult.success) {
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

    // Clear verification message if user re-submits form
    setShowVerificationMessage(false);
    setSubmittedEmail('');

    // --- Conditional Submission Logic --- 
    if (user) {
      // === AUTHENTICATED USER ===
      // Call the extracted function
      await handleAuthenticatedSubmitInternal(coreReviewData, photos);
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
        if (response.status === 409 && result.requiresLogin) {
          // User exists, backend responded with 409 and requiresLogin: true
          toast.info(result.message || "An account with this email already exists. Please log in.", { id: toastId });
          
          // Store review data and courseId in sessionStorage
          try {
            sessionStorage.setItem('pendingReviewDataForLogin', JSON.stringify(fullDataForPending));
            sessionStorage.setItem('pendingReviewCourseId', course.id); // course is from RatingFormProps
          } catch (e) {
            console.error("Error saving review data to sessionStorage:", e);
            // If sessionStorage fails, we can't proceed with the post-login completion.
            // Maybe just show a generic error or let the user try submitting again later.
            // For now, we'll allow the redirect to login but post-login completion might fail.
          }

          setIsModalOpen(false); // Close the review submission modal
          // Redirect to login page with email, message, and returnUrl for post-login completion
          router.push(`/login?email=${encodeURIComponent(result.email)}&message=${encodeURIComponent("Please log in to submit your review.")}&returnUrl=/courses/${course.id}/review?afterLogin=true`);
        } else if (response.ok) { // Handles 201 Created (and potentially other 2xx)
          toast.success(result.message || "Review submitted! Please check your email to verify.", { id: toastId });
          setShowVerificationMessage(true);
          setSubmittedEmail(email); // email is the param from handleModalSubmit
          setIsModalOpen(false);
          // Optionally, reset form or redirect
          // router.push(`/courses/${course.id}?review_pending=true`);
        } else {
          // Handle other non-OK responses (like 400, 500)
          console.error("Submission failed with status:", response.status, "Result:", result);
          toast.error(result.error || result.message || "Failed to submit review. Please try again.", { id: toastId });
        }
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
                    : 'fill-gray-300 text-gray-300'
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

  // --- Conditionally render form or verification message --- 
  if (showVerificationMessage) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg mx-auto my-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h2 className="text-2xl font-semibold text-[#0A3357] mb-3">Check Your Email!</h2>
        <p className="text-gray-700 mb-4">
          We've sent a verification link to <span className="font-medium">{submittedEmail}</span>.
        </p>
        <p className="text-gray-700 mb-6">
          Please click the link in the email to verify and publish your review.
        </p>
        <p className="text-sm text-gray-500">
          (You can close this page now. Check your spam folder if you don't see the email.)
        </p>
      </div>
    );
  }
  // --- End conditional rendering ---

  const [showHelp, setShowHelp] = useState(false);
  const [helpDismissed, setHelpDismissed] = useState(false);

  // Show help on first load unless dismissed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('walkgolf_help_dismissed');
      if (!dismissed) setShowHelp(true);
      setHelpDismissed(!!dismissed);
    }
  }, []);

  const handleHelpClose = () => {
    setShowHelp(false);
    localStorage.setItem('walkgolf_help_dismissed', '1');
    setHelpDismissed(true);
  };

  return (
    <>
      {/* Help Modal and Trigger */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent
          className="w-full sm:max-w-md sm:rounded-2xl p-0 min-h-[100dvh] max-h-[100dvh] sm:min-h-0 sm:max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 bg-white sm:top-1/2 sm:left-1/2 sm:fixed sm:translate-x-[-50%] sm:translate-y-[-50%]"
          style={{
            maxWidth: '75vw',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <DialogHeader className="pt-6 sm:pt-8 px-4 sm:px-8">
            <DialogTitle className="text-lg sm:text-xl">How to Rate This Course</DialogTitle>
          </DialogHeader>

          <DialogDescription asChild>
            <div className="space-y-4 text-left text-gray-700 flex-1 overflow-y-auto px-4 sm:px-8">
              <p><b>Your feedback helps other walking golfers! Here's how to fill out the form:</b></p>
              <ul className="list-disc pl-5 space-y-2">
                <li><b>Overall Walkability:</b> Is the course walkable? Rate how easy or challenging it is to walk the entire course.</li>
                <li><b>Detailed Walkability Ratings:</b>
                  <ul className="list-disc pl-5">
                    <li><b>Terrain & Hilliness:</b> How flat or hilly is the course?</li>
                    <li><b>Distance Between Holes:</b> Are the holes close together or far apart?</li>
                    <li><b>Course Value:</b> Was the course a good value for the price?</li>
                    <li><b>Course Quality:</b> How well maintained was the course?</li>
                  </ul>
                </li>
                <li><b>Add Photos:</b> (Optional) Share photos of the course, paths, or views to help others see what to expect.</li>
                <li><b>Pros & Cons:</b> List what you liked and any challenges you faced while walking the course.</li>
                <li><b>Additional Comments:</b> Share any extra details about your experience that might help other golfers.</li>
                <li><b>Date Played:</b> Let us know when you played for context.</li>
              </ul>
              <p><b>Tips:</b></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be honest and specific—your review helps others decide where to play!</li>
                <li>Only review courses you've walked yourself.</li>
                <li>If you're unsure about a rating, just leave it blank or choose your best estimate.</li>
              </ul>
            </div>
          </DialogDescription>

          <div
            className="px-4 sm:px-8 pt-4 flex-shrink-0 sm:flex sm:justify-center"
            style={{
              paddingBottom: `max(env(safe-area-inset-bottom, 0px), 1.5rem)`,
            }}
          >
            <button
              onClick={handleHelpClose}
              className="w-full sm:w-auto py-2 px-4 sm:px-6 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Got it!
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Persistent Help Button (Desktop: top-right, Mobile: floating) */}
      <div className="relative">
        <div className="absolute right-0 top-0 z-20 hidden sm:block">
          <button
            type="button"
            aria-label="How to Rate"
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <HelpCircle className="w-5 h-5" /> How to Rate
          </button>
        </div>
        {/* Floating button for mobile */}
        <button
          type="button"
          aria-label="How to Rate"
          onClick={() => setShowHelp(true)}
          className="fixed bottom-5 right-5 z-50 sm:hidden bg-blue-600 text-white rounded-full p-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
        {/* Main form content below */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* --- Update Confirming Course Section Styling --- */}
          {/* Use same container style as other sections for alignment */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-2"> 
            <h2 className="text-xl font-semibold text-[#0A3357] mb-3">Confirming Course</h2>
            <p className="text-gray-800 font-medium pt-1"> {/* Added small top padding */}
                <span className="font-semibold">Course:</span> {course.courseName}
                {course.course_holes ? ` (${course.course_holes} Holes)` : ''}
            </p>
            {course.club_name && (
                <p className="text-gray-700 mt-1">
                     <span className="font-semibold">Club:</span> {course.club_name}
                </p>
            )}
            <p className="text-gray-600 mt-1 flex items-center">
                 <MapPin className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                 {course.location_address1 ? `${course.location_address1}, ` : ''}{course.location_city}, {course.location_state}
            </p>
          </div>
          {/* --- End Confirming Course Section --- */}

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
              {formErrors['overallRating'] && <p className="text-xs text-red-500 mt-1">{formErrors['overallRating']}</p>}
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
                {formErrors['hillinessRating'] && <p className="text-xs text-red-500 mt-1">{formErrors['hillinessRating']}</p>}
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
                {formErrors['distanceRating'] && <p className="text-xs text-red-500 mt-1">{formErrors['distanceRating']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Value *
                </label>
                <CostRating
                  rating={costRating}
                  hovered={hoveredCostRating}
                  setRating={setCostRating}
                  setHovered={setHoveredCostRating}
                  size="lg"
                  descriptions={{
                    1: "Poor Value",
                    2: "Below Average Value",
                    3: "Average Value",
                    4: "Good Value",
                    5: "Excellent Value"
                  }}
                />
                <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
                  {(hoveredCostRating || costRating) > 0
                    ? (
                        {1: "Poor Value", 2: "Below Average Value", 3: "Average Value", 4: "Good Value", 5: "Excellent Value"}
                        [hoveredCostRating || costRating] || ''
                      )
                    : 'Larger $ icons mean greater value'
                  }
                </p>
                {formErrors['costRating'] && <p className="text-xs text-red-500 mt-1">{formErrors['costRating']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Quality *
                </label>
                <ConditionsRating
                  rating={courseConditionRating}
                  hovered={hoveredConditionRating}
                  setRating={setCourseConditionRating}
                  setHovered={setHoveredConditionRating}
                  size="lg"
                  descriptions={{
                    1: "Poor course quality",
                    2: "Below average course quality",
                    3: "Average course quality",
                    4: "Good course quality",
                    5: "Excellent course quality"
                  }}
                />
                <p className="mt-2 text-sm text-gray-600 min-h-[1.25rem]">
                  {(hoveredConditionRating || courseConditionRating) > 0
                    ? (
                        {1: "Poor course quality", 2: "Below average course quality", 3: "Average course quality", 4: "Good course quality", 5: "Excellent course quality"}
                        [hoveredConditionRating || courseConditionRating] || ''
                      )
                    : 'Larger icons mean better maintained'
                  }
                </p>
                {formErrors['courseConditionRating'] && <p className="text-xs text-red-500 mt-1">{formErrors['courseConditionRating']}</p>}
              </div>
            </div>
          </div>

          {/* Section 5: Photos & Media */}
          {user ? (
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
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Add Photos</h3>
              <p className="text-sm text-gray-500">
                To add photos to your review, please log in or create an account. Photos help other golfers see the course conditions and views!
              </p>
              {/* Optionally, add a button/link to the login page */}
              {/* <button 
                type="button" 
                onClick={() => router.push('/login')} 
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Log in to add photos
              </button> */}
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
          {isModalOpen && pendingReviewData && (
              <ReviewSubmitModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setPendingReviewData(null); // Clear data if modal is closed
                }}
                onSubmit={handleModalSubmit}
                reviewData={pendingReviewData}
              />
            )}
        </form>
      </div>
    </>
  )
} 