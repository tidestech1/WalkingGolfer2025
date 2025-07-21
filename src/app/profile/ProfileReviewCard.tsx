import React from 'react';

import { Star, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatFullDate } from '@/lib/utils/date';
import { deriveReviewerDisplayName } from '@/lib/utils/reviewUtils';
import type { CourseReview } from '@/types/review';
import type { GolfCourse } from '@/types/course'; // Import GolfCourse type

interface ProfileReviewCardProps {
  review: CourseReview;
  course: GolfCourse; // Add course prop
}

// Helper to render stars (can be moved to a common utils file if not already)
const renderStars = (rating: number | null, maxStars = 5) => {
  const r = Math.round(rating ?? 0);
  return Array.from({ length: maxStars }, (_, i) => (
    <Star
      key={i}
      className={`w-5 h-5 ${i < r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
    />
  ));
};

const ProfileReviewCard: React.FC<ProfileReviewCardProps> = ({ review, course }) => {
  const displayName = review.userDisplayName || deriveReviewerDisplayName(null, review);
  const walkingDate = formatDate(review.walkingDate); // Month/year format
  const reviewDate = formatFullDate(review.createdAt); // Full date format

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      {/* Course Information Section */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 hover:text-green-700">
            <Link href={`/courses/${course.id}`}>
              {course.courseName}
              {course.course_holes && <span className="text-sm font-normal text-gray-600 ml-1">({course.course_holes} holes)</span>}
            </Link>
          </h3>
          {course.club_name && course.club_name !== course.courseName && (
            <p className="text-sm text-gray-600">{course.club_name}</p>
          )}
          <p className="text-xs text-gray-500">{course.location_city}, {course.location_state}</p>
        </div>
        <div className="mt-2 sm:mt-0">
          <Link href={`/courses/${course.id}`}>
            <Button variant="link" className="text-sm text-green-600 hover:text-green-700 p-0 h-auto">
              View Course
              <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
      <Separator className="mb-4" />

      {/* Reviewer and Rating Section (similar to ReviewItem) */}
      <div className="flex items-start mb-4">
        <Avatar className="hidden md:block h-10 w-10">
          <AvatarImage src={review.userPhotoUrl ?? undefined} alt={displayName} />
          <AvatarFallback>{displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 ml-0 md:ml-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">Reviewed: {reviewDate}</p>
          </div>
          <div className="flex items-center mt-1">
            {renderStars(review.overallRating)}
            <span className="ml-2 text-xs text-gray-600">({review.overallRating?.toFixed(1)})</span>
          </div>
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 text-sm mb-4 leading-relaxed">{review.comment}</p>

      {/* Pros and Cons */}
      {(review.pros && review.pros.length > 0 || review.cons && review.cons.length > 0) && (
        <>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {review.pros && review.pros.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-700 flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1.5" /> Pros
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {review.pros.map((pro, index) => (
                    <li key={`pro-${index}`} className="text-sm text-gray-600">{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.cons && review.cons.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-700 flex items-center">
                  <ThumbsDown className="w-4 h-4 mr-1.5" /> Cons
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {review.cons.map((con, index) => (
                    <li key={`con-${index}`} className="text-sm text-gray-600">{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Additional Details */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 sm:gap-y-2 sm:gap-x-2 md:gap-x-3 text-xs text-gray-500 border-t pt-3 mt-3">
        <span>Walked on: {walkingDate}</span>
        {review.courseQualityRating !== undefined && (
          <>
            <Separator orientation="vertical" className="h-4 self-center hidden sm:inline-block" />
            <span>Golf Quality: <Badge variant="secondary">{review.courseQualityRating?.toFixed(1)}/5</Badge></span>
          </>
        )}
        {review.hillinessRating !== undefined && (
          <>
            <Separator orientation="vertical" className="h-4 self-center hidden sm:inline-block" />
            <span>Hilliness: <Badge variant="secondary">{review.hillinessRating?.toFixed(1) ?? 'N/A'}/5</Badge></span>
          </>
        )}
        {review.distanceRating !== undefined && (
          <>
            <Separator orientation="vertical" className="h-4 self-center hidden sm:inline-block" />
            <span>Green to Tee: <Badge variant="secondary">{review.distanceRating?.toFixed(1) ?? 'N/A'}/5</Badge></span>
          </>
        )}
        {review.costRating !== undefined && (
          <>
            <Separator orientation="vertical" className="h-4 self-center hidden sm:inline-block" />
            <span>Value: <Badge variant="secondary">{review.costRating?.toFixed(1) ?? 'N/A'}/5</Badge></span>
          </>
        )}
        {review.courseConditionRating !== undefined && (
          <>
            <Separator orientation="vertical" className="h-4 self-center hidden sm:inline-block" />
            <span>Condition: <Badge variant="secondary">{review.courseConditionRating?.toFixed(1)}/5</Badge></span>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileReviewCard; 