'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getUserReviews, getUserProfile } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CourseReview } from '@/types/review'
import type { UserProfile } from '@/types/user'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserData = useCallback(async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setLoading(true)
      const [userReviews, userProfile] = await Promise.all([
        getUserReviews(user.uid),
        getUserProfile(user.uid)
      ]);

      setReviews(userReviews)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, router])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) {
return null
}

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{profile?.displayName || user.displayName}</h1>
              <p className="text-gray-600">{profile?.email || user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Your Reviews</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/courses/${review.courseId}`}
                      className="text-lg font-medium text-green-600 hover:text-green-700"
                    >
                      {review.courseId}
                    </Link>
                    <div className="text-sm text-gray-500">
                      {new Date(review.walkingDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-6 mb-2">
                    <div>
                      <span className="text-sm text-gray-500">Walkability:</span>{' '}
                      <span className="font-medium">
                        {review.walkabilityRating}/5
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Condition:</span>{' '}
                      <span className="font-medium">
                        {review.courseConditionRating}/5
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Overall:</span>{' '}
                      <span className="font-medium">{review.overallRating}/5</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{review.comment}</p>

                  {(review.pros.length > 0 || review.cons.length > 0) && (
                    <div className="flex space-x-6">
                      {review.pros.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-green-600 mb-1">
                            Pros
                          </div>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {review.pros.map((pro, index) => (
                              <li key={index}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {review.cons.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-red-600 mb-1">
                            Cons
                          </div>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {review.cons.map((con, index) => (
                              <li key={index}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven&apos;t written any reviews yet.</p>
              <Link
                href="/map"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Find courses to review
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 