/**
 * Post-processes HTML content to set appropriate link behavior:
 * - Internal links (relative, starting with /) open in same tab
 * - External links (absolute URLs) open in new tab with security attributes
 */
export function processLinksInHTML(html: string): string {
  if (!html) return html
  
  // More robust regex that captures the entire <a> tag
  return html.replace(/<a\s+([^>]+)>/gi, (match, attributes) => {
    // Extract href value
    const hrefMatch = attributes.match(/href\s*=\s*["']([^"']+)["']/i)
    if (!hrefMatch) return match // No href found, return original
    
    const href = hrefMatch[1]
    
    // Check if it's an internal link
    const isInternal = href && (
      href.startsWith('/') || 
      href.startsWith('./') || 
      href.startsWith('../') || 
      href.startsWith('#') ||
      (!href.includes('://') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
    )
    
    // Remove any existing target and rel attributes
    let cleanAttributes = attributes.replace(/\s*(target|rel)\s*=\s*["'][^"']*["']/gi, '')
    
    if (isInternal) {
      // Internal link - same tab, no target or rel attributes
      return `<a ${cleanAttributes}>`
    } else {
      // External link - new tab with security
      return `<a ${cleanAttributes} target="_blank" rel="noopener noreferrer">`
    }
  })
} 