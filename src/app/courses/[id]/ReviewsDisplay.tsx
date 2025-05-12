'use client'

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { CourseReview } from '@/types/review';
import ReviewItem from './ReviewItem';

interface ReviewsDisplayProps {
  reviews: CourseReview[];
}

const INITIAL_REVIEWS_COUNT = 3; // Number of reviews to show initially

export default function ReviewsDisplay({ reviews }: ReviewsDisplayProps): JSX.Element {
  const [visibleCount, setVisibleCount] = useState(INITIAL_REVIEWS_COUNT);

  const showMoreReviews = () => {
    setVisibleCount(reviews.length); // Show all reviews
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMoreReviews = reviews.length > visibleCount;

  return (
    <div>
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {visibleReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">
          No reviews yet. Be the first to review this course!
        </p>
      )}

      {hasMoreReviews && (
        <div className="mt-6 text-center"> 
          <Button 
            variant="outline" 
            onClick={showMoreReviews}
          >
            Show All {reviews.length} Reviews
          </Button>
        </div>
      )}
    </div>
  );
} 