export type NewsSource = "internal" | "stewart-golf" | "legacy";

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
export type CreateNewsArticle = Omit<NewsArticle, "id" | "viewCount" | "lastViewedAt">;
