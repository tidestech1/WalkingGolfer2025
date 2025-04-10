'use client'

import AdminProtectedRoute from '@/app/components/AdminProtectedRoute'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <AdminProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {children}
        </div>
      </main>
    </AdminProtectedRoute>
  )
} 