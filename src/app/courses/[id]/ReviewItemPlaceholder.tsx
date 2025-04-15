// Placeholder component - replace with actual ReviewItem implementation
import React from 'react';

import { CourseReview } from '@/types/review';

interface ReviewItemPlaceholderProps {
  review: CourseReview;
}

const ReviewItemPlaceholder: React.FC<ReviewItemPlaceholderProps> = ({ review }) => {
  return (
    <div className="border p-4 rounded-md bg-gray-50">
      <p className="font-semibold">Review ID: {review.id} (Placeholder)</p>
      <p className="text-sm text-gray-600">Comment: {review.comment?.substring(0, 100)}...</p>
      <p className="text-xs text-gray-400">Status: {review.status}, Verified: {String(review.email_verified)}</p>
    </div>
  );
};

export default ReviewItemPlaceholder; 