'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, PenTool, TrendingUp, MapPin, DollarSign, Mountain } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CourseReview } from '@/types/review';
import ReviewItem from './ReviewItem';

interface ReviewsDisplayProps {
  reviews: CourseReview[];
}

const INITIAL_REVIEWS_COUNT = 3; // Number of reviews to show initially

// Rating categories that users can review
const RATING_CATEGORIES = [
  { icon: Star, label: 'Overall Experience', description: 'Rate your complete walking experience' },
  { icon: Mountain, label: 'Terrain & Hilliness', description: 'How challenging was the walking terrain?' },
  { icon: MapPin, label: 'Distance & Layout', description: 'Walking distances between holes and to facilities' },
  { icon: DollarSign, label: 'Course Value', description: 'Value for money considering walkability' },
  { icon: TrendingUp, label: 'Course Conditions', description: 'Overall maintenance and course quality' },
];

export default function ReviewsDisplay({ reviews }: ReviewsDisplayProps): JSX.Element {
  const [visibleCount, setVisibleCount] = useState(INITIAL_REVIEWS_COUNT);
  const params = useParams();
  const courseId = params?.['id'] as string;

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
        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="p-8 text-center">
            {/* Icon and Headline */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <PenTool className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Be the First to Share Your Walking Experience!
            </h3>
            
            {/* Brief explanation of review value */}
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Help fellow walking golfers by sharing your experience with the terrain, 
              distances, and overall walkability of this course. Your insights make a difference!
            </p>
            
            {/* Preview of rating categories */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">You'll rate aspects like:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {RATING_CATEGORIES.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <div key={index} className="flex items-center gap-2 text-gray-600">
                      <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{category.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Prominent "Write First Review" button */}
            <Link href={`/courses/${courseId}/review`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3">
                <Star className="w-5 h-5 mr-2" />
                Write First Review
              </Button>
            </Link>
            
            <p className="text-xs text-gray-500 mt-3">
              Takes 3-5 minutes • Help build the Walking Golfer community
            </p>
          </CardContent>
        </Card>
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