'use client'

import SocialShare from './SocialShare'
import ArticleNewsletterSignup from './ArticleNewsletterSignup'

interface ClientSocialShareProps {
  url: string
  title: string
  excerpt: string
  className?: string
}

interface ClientNewsletterProps {
  className?: string
}

export function ClientSocialShare({ url, title, excerpt, className = '' }: ClientSocialShareProps) {
  return (
    <div className={className}>
      <SocialShare 
        url={url}
        title={title}
        excerpt={excerpt}
      />
    </div>
  )
}

export function ClientNewsletter({ className = '' }: ClientNewsletterProps) {
  return (
    <div className={className}>
      <ArticleNewsletterSignup />
    </div>
  )
} 