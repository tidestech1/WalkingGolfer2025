'use client'

import { useState, useEffect } from 'react'
import { FaFacebook, FaLinkedin, FaWhatsapp, FaEnvelope, FaLink, FaCheck, FaShare } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

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

  const shareOnFacebook = () => {
    if (!fullUrl) return
    
    // Try Facebook app first, fallback to web
    const appUrl = `fb://facewebmodal/f?href=${encodedUrl}`
    const webUrl = shareLinks.facebook
    
    // Modern approach: try app link, fallback to web on fail
    const tryAppThenWeb = () => {
      // Create a hidden iframe to test if app opens
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = appUrl
      document.body.appendChild(iframe)
      
      // Fallback to web after short delay
      setTimeout(() => {
        document.body.removeChild(iframe)
        window.open(webUrl, '_blank', 'width=600,height=400')
      }, 500)
    }
    
    tryAppThenWeb()
  }

  const shareOnTwitter = () => {
    if (!fullUrl) return
    
    // X (formerly Twitter) app deep link
    const appUrl = `twitter://post?message=${encodedTitle}%20${encodedUrl}`
    const webUrl = shareLinks.twitter
    
    try {
      // Try app first
      window.location.href = appUrl
      // Fallback to web  
      setTimeout(() => {
        window.open(webUrl, '_blank', 'width=600,height=400')
      }, 1000)
    } catch (e) {
      window.open(webUrl, '_blank', 'width=600,height=400')
    }
  }

  const shareOnLinkedIn = () => {
    if (!fullUrl) return
    window.open(shareLinks.linkedin, '_blank', 'width=600,height=400')
  }

  const shareOnWhatsApp = () => {
    if (!fullUrl) return
    
    // WhatsApp app deep link
    const appUrl = `whatsapp://send?text=${encodedTitle}%20${encodedUrl}`
    const webUrl = shareLinks.whatsapp
    
    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      try {
        window.location.href = appUrl
        // Fallback to web WhatsApp
        setTimeout(() => {
          window.open(webUrl, '_blank')
        }, 1000)
      } catch (e) {
        window.open(webUrl, '_blank')
      }
    } else {
      // Desktop - go straight to WhatsApp Web
      window.open(webUrl, '_blank', 'width=600,height=400')
    }
  }

  const shareViaEmail = () => {
    if (!fullUrl) return
    window.location.href = shareLinks.email
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-gray-600">
          <FaShare className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Share:</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Facebook */}
          <button
            onClick={shareOnFacebook}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Share on Facebook"
          >
            <FaFacebook className="h-4 w-4" />
          </button>
          
          {/* X (Twitter) */}
          <button
            onClick={shareOnTwitter}
            className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            title="Share on X"
          >
            <FaXTwitter className="h-4 w-4" />
          </button>
          
          {/* LinkedIn */}
          <button
            onClick={shareOnLinkedIn}
            className="p-2 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            title="Share on LinkedIn"
          >
            <FaLinkedin className="h-4 w-4" />
          </button>
          
          {/* WhatsApp */}
          <button
            onClick={shareOnWhatsApp}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            title="Share on WhatsApp"
          >
            <FaWhatsapp className="h-4 w-4" />
          </button>
          
          {/* Email */}
          <button
            onClick={shareViaEmail}
            className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            title="Share via Email"
          >
            <FaEnvelope className="h-4 w-4" />
          </button>
          
          {/* Copy Link */}
          <div className="relative">
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              title="Copy Link"
            >
              {copied ? <FaCheck className="h-4 w-4" /> : <FaLink className="h-4 w-4" />}
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