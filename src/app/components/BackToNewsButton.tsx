'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BackToNewsButton() {
  const router = useRouter()

  return (
    <button 
      onClick={() => router.push('/news')}
      className="inline-flex items-center text-blue-600 hover:text-blue-800"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to News
    </button>
  )
} 