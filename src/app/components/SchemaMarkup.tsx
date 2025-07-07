import React from 'react'

interface OrganizationSchemaProps {
  type: 'organization'
}

interface WebsiteSchemaProps {
  type: 'website'
}

interface ArticleSchemaProps {
  type: 'article'
  title: string
  description: string
  author: string
  publishedAt: string
  updatedAt?: string
  imageUrl?: string
  url: string
}

interface LocalBusinessSchemaProps {
  type: 'localbusiness'
  name: string
  description: string
  address: {
    streetAddress: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  telephone?: string
  email?: string
}

type SchemaMarkupProps = OrganizationSchemaProps | WebsiteSchemaProps | ArticleSchemaProps | LocalBusinessSchemaProps

export default function SchemaMarkup(props: SchemaMarkupProps) {
  const generateSchema = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.walkinggolfer.com'
    
    switch (props.type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Walking Golfer",
          "url": baseUrl,
          "logo": `${baseUrl}/images/logo.png`,
          "description": "Find and review walkable golf courses across the United States. Join our community of walking golfers.",
          "sameAs": [
            // Add social media URLs when available
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "email": "info@walkinggolfer.com"
          }
        }

      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Walking Golfer",
          "url": baseUrl,
          "description": "Find and review walkable golf courses across the United States",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        }

      case 'article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": props.title,
          "description": props.description,
          "author": {
            "@type": "Person",
            "name": props.author
          },
          "publisher": {
            "@type": "Organization",
            "name": "Walking Golfer",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/images/logo.png`
            }
          },
          "datePublished": props.publishedAt,
          "dateModified": props.updatedAt || props.publishedAt,
          "url": `${baseUrl}${props.url}`,
          "image": props.imageUrl ? {
            "@type": "ImageObject",
            "url": props.imageUrl
          } : undefined,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${baseUrl}${props.url}`
          }
        }

      case 'localbusiness':
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": props.name,
          "description": props.description,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": props.address.streetAddress,
            "addressLocality": props.address.city,
            "addressRegion": props.address.state,
            "postalCode": props.address.postalCode,
            "addressCountry": props.address.country
          },
          "telephone": props.telephone,
          "email": props.email,
          "url": baseUrl
        }

      default:
        return null
    }
  }

  const schema = generateSchema()
  
  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2)
      }}
    />
  )
} 