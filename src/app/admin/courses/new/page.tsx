'use client'

import AdminProtectedRoute from '@/app/components/AdminProtectedRoute'
import CourseForm from '@/app/components/CourseForm'

export default function NewCoursePage(): JSX.Element {
  return (
    <AdminProtectedRoute>
      <CourseForm isEdit={false} />
    </AdminProtectedRoute>
  )
} 