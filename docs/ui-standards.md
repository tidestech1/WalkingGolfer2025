# UI Standards & Guidelines

This document outlines the UI/UX standards and component guidelines for The Walking Golfer application to ensure consistency across the entire codebase.

## 🍞 Toast Notifications

**Standard Library:** [Sonner](https://sonner.emilkowal.ski/)  
**Configuration:** Located in `src/app/layout.tsx` with `richColors` and `position="top-right"`

### Usage

```typescript
import { toast } from 'sonner'

// Success messages
toast.success('Article updated successfully')
toast.success('Profile saved!')

// Error messages  
toast.error('Failed to save article')
toast.error('Invalid email address')

// Informational messages
toast.info('Feature coming soon!')
toast.info('Please verify your email')

// Loading states
const toastId = toast.loading('Saving article...')
toast.success('Article saved!', { id: toastId })

// Promise handling
toast.promise(saveArticle(), {
  loading: 'Saving article...',
  success: 'Article saved successfully!',
  error: 'Failed to save article'
})
```

### Guidelines
- ✅ **DO** use descriptive, user-friendly messages
- ✅ **DO** use appropriate toast types (success, error, info, loading)
- ✅ **DO** provide context about what happened
- ❌ **DON'T** create custom toast components
- ❌ **DON'T** use other toast libraries (maintain consistency)
- ❌ **DON'T** use technical error messages for users

### Examples in Codebase
- `src/app/components/NewsArticleForm.tsx` - Article save notifications
- `src/app/profile/page.tsx` - Profile update notifications
- `src/app/courses/[id]/review/RatingForm.tsx` - Review submission notifications

---

## 🎨 Color Standards

**Primary Brand:** `#0A3357` (Walking Golfer Blue)  
**Success:** Green variants (handled by Sonner richColors)  
**Error:** Red variants (handled by Sonner richColors)  
**Warning:** Yellow/Orange variants  
**Info:** Blue variants

### Usage
```css
/* Primary actions, headers */
.primary { color: #0A3357; }

/* Use Tailwind utilities when possible */
text-[#0A3357]
bg-[#0A3357]
```

---

## 📝 Forms & Input Standards

### Guidelines
- Use consistent error states with toast notifications
- Provide loading states for submit buttons
- Include proper validation feedback
- Use placeholder text appropriately

### Button States
```typescript
// Loading state
<button disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Article'}
</button>
```

---

## 🔗 Navigation & Links

### Internal vs External Links
- **Internal links** (`/news/article`, `/profile`) → Same tab
- **External links** (`https://example.com`) → New tab with `target="_blank" rel="noopener noreferrer"`

### Implementation
The app uses `processLinksInHTML()` utility in `src/lib/linkUtils.ts` to automatically handle link behavior in rich content.

---

## 📱 Responsive Design

### Breakpoints
Follow Tailwind CSS breakpoints:
- `sm`: 640px+
- `md`: 768px+  
- `lg`: 1024px+
- `xl`: 1280px+

### Mobile-First Approach
```css
/* Mobile first, then scale up */
<div className="p-4 md:p-6 lg:p-8">
```

---

## 🎯 Icon Standards

### Primary Icon Library
**Library:** [Lucide React](https://lucide.dev/)  
**Usage:** `import { IconName } from 'lucide-react'`

### Social Media Icons
**Library:** [React Icons FA](https://react-icons.github.io/react-icons/)
**Usage:** `import { FaFacebook, FaXTwitter } from 'react-icons/fa6'`

### Guidelines
- Use consistent icon sizes within contexts (e.g., all nav icons same size)
- Include proper `aria-label` for accessibility
- Use semantic icon choices (checkmark for success, X for close)

---

## 🚀 Performance Standards

### Loading States
- Always provide loading feedback for async operations
- Use skeleton loaders for content that takes time to load
- Implement proper error boundaries

### Image Optimization
- Use Next.js `Image` component for optimization
- Provide proper `alt` attributes
- Use appropriate sizing and lazy loading

---

## ♿ Accessibility Standards

### General Guidelines
- Include proper ARIA labels
- Ensure keyboard navigation works
- Maintain proper color contrast ratios
- Use semantic HTML elements

### Toast Accessibility
Sonner automatically handles:
- Screen reader announcements
- Keyboard navigation
- Focus management

---

## 🔧 Development Guidelines

### File Organization
- Components in `src/app/components/`
- UI utilities in `src/lib/`
- Types in `src/types/`
- Hooks in `src/hooks/`

### Naming Conventions
- **Components:** PascalCase (`NewsCard.tsx`)
- **Utilities:** camelCase (`linkUtils.ts`)
- **Constants:** UPPER_SNAKE_CASE
- **CSS classes:** kebab-case or Tailwind utilities

### Code Standards
- Use TypeScript strictly (no `any` types)
- Include proper JSDoc comments for utilities
- Implement error boundaries for components
- Follow the patterns established in existing components

---

## 📚 References

- [Sonner Toast Documentation](https://sonner.emilkowal.ski/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

## 🔄 Updates & Maintenance

This document should be updated whenever:
- New UI libraries are added
- Standards change or evolve  
- New patterns are established
- Components are deprecated or replaced

**Last Updated:** January 2025
**Maintainer:** Development Team 