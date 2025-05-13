import React from 'react';

import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import Image from 'next/image';

// Assuming ShadCN components are correctly pathed
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deriveReviewerDisplayName } from '@/lib/utils/reviewUtils'; // Import the utility
import { CourseReview } from '@/types/review';

interface ReviewItemProps {
  review: CourseReview;
}

// Helper to format date
const formatDate = (date: Date | string | null): string => {
  if (!date) {
return 'N/A';
}
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Helper to render stars
const renderStars = (rating: number | null, maxStars = 5) => {
  const r = Math.round(rating ?? 0);
  return Array.from({ length: maxStars }, (_, i) => (
    <Star 
      key={i} 
      className={`w-5 h-5 ${i < r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
    />
  ));
};

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  // Use the utility function to get the display name
  // We pass null for profile as we only have review data here
  // The verify step should have populated review.userDisplayName correctly based on preference
  const displayName = review.userDisplayName || deriveReviewerDisplayName(null, review); 
  const walkingDate = formatDate(review.walkingDate);
  const reviewDate = formatDate(review.createdAt);

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-start mb-4">
        <Avatar className="hidden md:block">
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

      <p className="text-gray-700 text-sm mb-4 leading-relaxed">{review.comment}</p>
      
      {/* Conditionally render Separator only if there are pros or cons */}
      {(review.pros && review.pros.length > 0 || review.cons && review.cons.length > 0) && (
        <Separator className="my-4" />
      )}

      {/* Pros and Cons */}
      {(review.pros && review.pros.length > 0 || review.cons && review.cons.length > 0) && (
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
      )}

      {/* Additional Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 border-t pt-3 mt-3">
        <span>Walked on: {walkingDate}</span>
        {/* Removed Walkability Rating and its separator */}

        {/* Added Hilliness Rating */}
        <Separator orientation="vertical" className="h-4" />
        <span>Hilliness/Terrain: <Badge variant="secondary">{review.hillinessRating?.toFixed(1) ?? 'N/A'}/5</Badge></span>
        
        {/* Added Distance Rating */}
        <Separator orientation="vertical" className="h-4" />
        <span>Green to Tee Distance: <Badge variant="secondary">{review.distanceRating?.toFixed(1) ?? 'N/A'}/5</Badge></span>

        {/* Added Cost Rating */}
        <Separator orientation="vertical" className="h-4" />
        <span>Value: <Badge variant="secondary">{review.costRating?.toFixed(1) ?? 'N/A'}/5</Badge></span>

        {/* Kept Course Condition */}
        {review.courseConditionRating && (
           <>
            <Separator orientation="vertical" className="h-4" />
            <span>Course Condition: <Badge variant="secondary">{review.courseConditionRating?.toFixed(1)}/5</Badge></span>
           </>
        )}
      </div>
    </div>
  );
};

export default ReviewItem; 