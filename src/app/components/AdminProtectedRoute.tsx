'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { verifyAdminStatus } from '@/lib/firebase/firebaseUtils'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Component that protects admin routes
 * Redirects to login page if user is not logged in
 * Redirects to unauthorized page if user is not an admin
 */
export default function AdminProtectedRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, getIdToken } = useAuth()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    async function verifyAdmin(): Promise<void> {
      try {
        if (!user) {
          router.push('/')
          return
        }

        const idToken = await getIdToken()
        if (!idToken) {
          router.push('/')
          return
        }

        const result = await verifyAdminStatus(idToken)
        if (!result.success) {
          router.push('/')
          return
        }

        setIsVerifying(false)
      } catch (error) {
        console.error('Admin verification error:', error)
        router.push('/')
      }
    }

    void verifyAdmin()
  }, [user, router, getIdToken])

  if (isVerifying) {
    return <div>Verifying admin access...</div>
  }

  return <>{children}</>
} 