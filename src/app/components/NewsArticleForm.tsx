'use client'

import { useState, useEffect } from 'react'

import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createNewsArticle, updateNewsArticle, getAllTags, getAllCategories } from '@/lib/firebase/newsUtils'
import { uploadImage, deleteImage } from '@/lib/firebase/storageUtils'
import type { NewsArticle, CreateNewsArticle, NewsSource, NewsStatus } from '@/types/news'

import ImageUpload from './ImageUpload'

// Dynamic import of the rich text editor to avoid SSR issues
// Renamed variable to avoid potential conflicts
const DynamicRichTextEditor = dynamic(() => import('./RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full border rounded-md bg-gray-50 animate-pulse" />
})

interface NewsArticleFormProps {
  article?: NewsArticle
  isEdit?: boolean
}

export default function NewsArticleForm({ article, isEdit = false }: NewsArticleFormProps): JSX.Element {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  
  // Form state
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [content, setContent] = useState(article?.content || '')
  const [author, setAuthor] = useState(article?.author || 'The Walking Golfer')
  const [source, setSource] = useState<NewsSource>(article?.source || 'internal')
  const [sourceUrl, setSourceUrl] = useState(article?.sourceUrl || '')
  const [status, setStatus] = useState<NewsStatus>(article?.status || 'published')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(article?.imageUrl || '')
  const [category, setCategory] = useState(article?.category || '')
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription || '')
  const [tags, setTags] = useState<string[]>(article?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [publishedAt, setPublishedAt] = useState(
    article?.publishedAt 
      ? new Date(article.publishedAt).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  )
  const [isUploading, setIsUploading] = useState(false)
  
  // Load available tags and categories on mount
  useEffect(() => {
    const loadFormData = async (): Promise<void> => {
      try {
        const [tagsResult, categoriesResult] = await Promise.all([
          getAllTags(),
          getAllCategories()
        ])
        setAvailableTags(tagsResult)
        setAvailableCategories(categoriesResult)
      } catch (error) {
        console.error('Error loading form data:', error)
      }
    }
    
    loadFormData().catch(err => {
      console.error('Failed to load form data on mount:', err)
    })
  }, [])
  
  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && title && !slug) {
      setSlug(title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      )
    }
  }, [title, isEdit, slug])
  
  // Handle tag management
  const addTag = (): void => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (!trimmedTag) {
      return
    }
    
    if (!tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
    }
    
    setTagInput('')
  }
  
  const removeTag = (tagToRemove: string): void => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    setIsSubmitting(true)
    
    try {
      // Validate form
      if (!title || !slug || !excerpt || !content || !author || !publishedAt) {
        throw new Error('Please fill in all required fields')
      }
      
      // Handle image upload if there's a new image
      let imageUrl = currentImageUrl
      
      if (imageFile) {
        setIsUploading(true)
        try {
          // If we're replacing an existing image in edit mode, delete the old one
          if (isEdit && currentImageUrl && currentImageUrl.includes('firebasestorage.googleapis.com')) {
            await deleteImage(currentImageUrl)
          }
          
          // Upload the new image
          imageUrl = await uploadImage(imageFile, 'news')
        } catch (err) {
          console.error('Error handling image:', err)
          throw new Error('Failed to upload image. Please try again.')
        } finally {
          setIsUploading(false)
        }
      }
      
      // Prepare article data
      const articleData: CreateNewsArticle = {
        title,
        slug,
        excerpt,
        content,
        author,
        publishedAt: new Date(publishedAt).toISOString(),
        source,
        tags,
        category: category || '',
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        sourceUrl: sourceUrl || '',
        imageUrl: imageUrl || '',
        status,
        updatedAt: new Date().toISOString()
      }
      
      // Create or update article
      if (isEdit && article) {
        await updateNewsArticle(article.id, articleData)
        toast.success('Article updated successfully')
      } else {
        const { id } = await createNewsArticle(articleData)
        toast.success(`Article created successfully (ID: ${id})`)
        
        // Redirect to the article after a short delay
        setTimeout(() => {
          router.push(`/news/${slug}`)
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving article:', err)
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <>
      <form onSubmit={(e) => {
 void handleSubmit(e); 
}} className="space-y-6">

      
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^\w-]/g, '-').replace(/-+/g, '-').trim())}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          readOnly={isEdit}
        />
        <p className="mt-1 text-sm text-gray-500">
          URL-friendly identifier. Auto-generated from title on creation. Cannot be changed after creation.
        </p>
      </div>
      
      {/* Author, Date & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Author <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-1">
            Publication Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="publishedAt"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as NewsStatus)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Draft articles are only visible in admin areas
          </p>
        </div>
      </div>
      
      {/* Source & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as NewsSource)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="internal">Internal</option>
            <option value="stewart-golf">Stewart Golf</option>
            <option value="legacy">Legacy</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            id="category"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <datalist id="categories">
            {availableCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>
      
      {/* Source URL (conditional) */}
      {source !== 'internal' && (
        <div>
          <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Source URL
          </label>
          <input
            type="url"
            id="sourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/article"
          />
        </div>
      )}
      
      {/* Featured Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Featured Image
        </label>
        {isUploading ? (
          <div className="w-full h-56 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Uploading image...</p>
            </div>
          </div>
        ) : (
          <ImageUpload
            initialImage={currentImageUrl}
            onImageChange={(file) => {
              setImageFile(file)
              if (!file && currentImageUrl) {
                // Keep the current URL if just removing the new file
                setCurrentImageUrl(currentImageUrl)
              }
            }}
            aspectRatio="landscape"
            maxSizeMB={5}
          />
        )}
      </div>
      
      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
          Excerpt <span className="text-red-500">*</span>
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief summary of the article"
        />
      </div>
      
      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content <span className="text-red-500">*</span>
        </label>
        <DynamicRichTextEditor 
          initialValue={content} 
          onChange={setContent} 
        />
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex items-center">
          <input
            type="text"
            id="tags"
            list="tagOptions"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a tag and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <datalist id="tagOptions">
          {availableTags
            .filter(tag => !tags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag} />
            ))}
        </datalist>
        
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 flex-shrink-0 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* SEO Section */}
      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="font-medium text-gray-700 mb-3">SEO Options</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Custom title for SEO (defaults to article title)"
            />
          </div>
          
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Custom description for SEO (defaults to excerpt)"
            />
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full bg-[#0A3357] text-white py-3 px-4 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting 
          ? 'Saving...' 
          : (isEdit ? 'Update Article' : 'Create Article')
        }
      </button>
    </form>
  </>
  )
} 