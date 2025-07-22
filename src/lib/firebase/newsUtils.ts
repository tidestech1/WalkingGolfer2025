import type { NewsArticle, CreateNewsArticle } from '@/types/news';

import { getDocuments, addDocument, updateDocument, deleteDocument } from './firebaseUtils';
import { getAdminFirestore } from './firebaseAdmin';

// Fallback news data for when Firebase is unavailable
export const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 'fallback-1',
    title: 'Firebase Connection Issue',
    content: 'We are currently experiencing issues connecting to our database. Please try again later.',
    slug: 'firebase-connection-issue',
    excerpt: 'We are currently experiencing technical difficulties with our database connection.',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: 'System',
    viewCount: 0,
    category: 'Announcements',
    tags: ['system', 'maintenance'],
    imageUrl: '/images/placeholder.jpg'
  }
];

/**
 * Get news articles with optional filtering
 * Works on both server and client
 */
export async function getNewsArticles(options: {
  tag?: string
  source?: string
  category?: string
  limit?: number
  includeDrafts?: boolean
} = {}): Promise<NewsArticle[]> {
  try {
    let articles: NewsArticle[] = [];
    
    if (typeof window === 'undefined') {
      // Server-side: Use Admin SDK
      console.log("Using Admin Firestore SDK (server-side) for getNewsArticles");
      const adminDb = getAdminFirestore();
      const snapshot = await adminDb.collection('news').get();
      
      articles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsArticle[];
    } else {
      // Client-side: Use existing client SDK function
      console.log("Using Client Firestore SDK (client-side) for getNewsArticles");
      articles = await getDocuments('news');
    }
    
    // Filter articles based on options
    let filteredArticles = articles;
    
    // Filter by status - exclude drafts unless explicitly requested
    if (!options.includeDrafts) {
      filteredArticles = filteredArticles.filter(article => 
        article.status === 'published' || !article.status // Default to published for legacy articles
      );
    }
    
    if (options.tag) {
      // Assign to new const to satisfy TS within filter callback
      const tagToFilter = options.tag;
      filteredArticles = filteredArticles.filter(article => 
        article.tags?.includes(tagToFilter)
      );
    }
    
    if (options.source) {
      filteredArticles = filteredArticles.filter(article => 
        article.source === options.source
      );
    }
    
    if (options.category) {
      filteredArticles = filteredArticles.filter(article => 
        article.category === options.category
      );
    }
    
    // Sort by publishedAt desc
    filteredArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    // Apply limit if specified
    if (options.limit) {
      filteredArticles = filteredArticles.slice(0, options.limit);
    }
    
    return filteredArticles;
  } catch (error) {
    console.error('Error fetching news articles:', error);
    return FALLBACK_NEWS;
  }
}

/**
 * Get a single news article by slug
 * Works on both server and client
 */
export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  try {
    let articles: NewsArticle[] = [];
    
    if (typeof window === 'undefined') {
      // Server-side: Use Admin SDK
      console.log("Using Admin Firestore SDK (server-side) for getNewsArticleBySlug");
      const adminDb = getAdminFirestore();
      const snapshot = await adminDb.collection('news').where('slug', '==', slug).limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as NewsArticle;
    } else {
      // Client-side: Use existing client SDK function
      console.log("Using Client Firestore SDK (client-side) for getNewsArticleBySlug");
      articles = await getDocuments('news');
      
      const article = articles.find(a => a.slug === slug);
      
      if (article) {
        // Only increment view count on client-side viewing
        await incrementViewCount(article.id);
        return article;
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error fetching news article:', error);
    return null;
  }
}

/**
 * Get a single news article by ID
 * Works on both server and client
 */
export async function getNewsArticleById(id: string): Promise<NewsArticle | null> {
  try {
    if (typeof window === 'undefined') {
      // Server-side: Use Admin SDK
      console.log("Using Admin Firestore SDK (server-side) for getNewsArticleById");
      const adminDb = getAdminFirestore();
      const doc = await adminDb.collection('news').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      } as NewsArticle;
    } else {
      // Client-side: Use existing client SDK function
      console.log("Using Client Firestore SDK (client-side) for getNewsArticleById");
      const articles = await getDocuments('news');
      
      const article = articles.find(a => a.id === id);
      
      if (article) {
        return article;
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error fetching news article by ID:', error);
    return null;
  }
}

/**
 * Create a new news article
 */
export async function createNewsArticle(article: CreateNewsArticle): Promise<{ id: string, success: boolean }> {
  try {
    const articles = await getDocuments('news');
    
    const existingArticle = articles.find(a => a.slug === article.slug);
    if (existingArticle) {
      throw new Error(`Article with slug '${article.slug}' already exists`);
    }
    
    const newArticle = {
      ...article,
      updatedAt: article.updatedAt || article.publishedAt,
      viewCount: 0,
      status: article.status || 'published', // Default to published
      // lastViewedAt is implicitly undefined
    };
    
    // Cast to NewsArticle before passing to addDocument
    const docRef = await addDocument('news', newArticle as NewsArticle);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating news article:', error);
    throw error;
  }
}

/**
 * Update an existing news article
 */
export async function updateNewsArticle(id: string, updates: Partial<CreateNewsArticle>): Promise<boolean> {
  try {
    const articles = await getDocuments('news');
    
    const article = articles.find(a => a.id === id);
    if (!article) {
      throw new Error(`Article with ID '${id}' not found`);
    }
    
    if (updates.slug && updates.slug !== article.slug) {
      const existingArticle = await getNewsArticleBySlug(updates.slug);
      if (existingArticle) {
        throw new Error(`Article with slug '${updates.slug}' already exists`);
      }
    }
    
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDocument('news', id, updatedData);
    return true;
  } catch (error) {
    console.error('Error updating news article:', error);
    throw error;
  }
}

/**
 * Delete a news article
 */
export async function deleteNewsArticle(id: string): Promise<boolean> {
  try {
    await deleteDocument('news', id);
    return true;
  } catch (error) {
    console.error('Error deleting news article:', error);
    throw error;
  }
}

/**
 * Increment view count for an article
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    const articles = await getDocuments('news');
    
    const article = articles.find(a => a.id === id);
    if (article) {
      await updateDocument('news', id, {
        // Use fallback for potentially undefined viewCount
        viewCount: (article.viewCount || 0) + 1,
        lastViewedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

/**
 * Get all available tags from articles
 */
export async function getAllTags(): Promise<string[]> {
  try {
    const articles = await getNewsArticles();
    const tagSet = new Set<string>();
    
    articles.forEach(article => {
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
}

/**
 * Get all available categories from articles
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const articles = await getNewsArticles();
    const categorySet = new Set<string>();
    
    articles.forEach(article => {
      if (article.category) {
        categorySet.add(article.category);
      }
    });
    
    return Array.from(categorySet).sort();
  } catch (error) {
    console.error('Error getting all categories:', error);
    return [];
  }
}

/**
 * Get all news articles for admin use (includes drafts)
 */
export async function getAllNewsArticlesForAdmin(): Promise<NewsArticle[]> {
  try {
    return await getNewsArticles({ includeDrafts: true });
  } catch (error) {
    console.error('Error fetching admin news articles:', error);
    return [];
  }
} 