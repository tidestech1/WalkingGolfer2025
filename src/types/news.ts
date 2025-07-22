export type NewsSource = 'internal' | 'stewart-golf' | 'legacy';
export type NewsStatus = 'draft' | 'published';

export interface NewsArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  updatedAt?: string
  imageUrl?: string
  tags?: string[]
  source?: NewsSource
  sourceUrl?: string
  status?: NewsStatus
  // SEO Fields
  metaTitle?: string
  metaDescription?: string
  // Content Organization
  category?: string
  relatedArticles?: string[]
  // Analytics Support
  viewCount?: number
  lastViewedAt?: string
}

// Helper type for creating articles
export type CreateNewsArticle = Omit<NewsArticle, 'id' | 'viewCount' | 'lastViewedAt'>; 