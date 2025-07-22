'use client'

import { useState, useEffect } from 'react'
import { Share, Facebook, Twitter, Mail, Link as LinkIcon, MessageCircle, Check } from 'lucide-react'

interface SocialShareProps {
  url: string
  title: string
  excerpt?: string
  className?: string
}

export default function SocialShare({ url, title, excerpt = '', className = '' }: SocialShareProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState('')

  // Set the full URL after component mounts (client-side only)
  useEffect(() => {
    setFullUrl(`${window.location.origin}${url}`)
  }, [url])

  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedExcerpt = encodeURIComponent(excerpt)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0ARead more: ${encodedUrl}`
  }

  const copyToClipboard = async () => {
    if (!fullUrl) return // Don't copy if URL isn't ready yet
    
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = fullUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = (platform: string) => {
    if (!fullUrl) return // Don't share if URL isn't ready yet
    window.open(shareLinks[platform as keyof typeof shareLinks], '_blank', 'width=600,height=400')
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-gray-600">
          <Share className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Share:</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Facebook */}
          <button
            onClick={() => handleShare('facebook')}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Share on Facebook"
          >
            <Facebook className="h-4 w-4" />
          </button>
          
          {/* Twitter */}
          <button
            onClick={() => handleShare('twitter')}
            className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            title="Share on X (Twitter)"
          >
            <Twitter className="h-4 w-4" />
          </button>
          
          {/* LinkedIn */}
          <button
            onClick={() => handleShare('linkedin')}
            className="p-2 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            title="Share on LinkedIn"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </button>
          
          {/* WhatsApp */}
          <button
            onClick={() => handleShare('whatsapp')}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            title="Share on WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          
          {/* Email */}
          <button
            onClick={() => handleShare('email')}
            className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            title="Share via Email"
          >
            <Mail className="h-4 w-4" />
          </button>
          
          {/* Copy Link */}
          <div className="relative">
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              title="Copy Link"
            >
              {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            </button>
            {copied && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Copied!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 