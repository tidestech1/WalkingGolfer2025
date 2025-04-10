'use client'

import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  initialValue: string
  onChange: (value: string) => void
}

export default function RichTextEditor({ initialValue, onChange }: RichTextEditorProps): JSX.Element {
  const [value, setValue] = useState(initialValue || '')
  
  useEffect(() => {
    // Update the editor when the initialValue prop changes
    // This is useful when editing existing articles
    if (initialValue !== value) {
      setValue(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when initialValue changes externally
  }, [initialValue])
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newValue = e.target.value
    setValue(newValue)
    onChange(newValue)
  }
  
  return (
    <textarea
      value={value}
      onChange={handleChange}
      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      placeholder="Write your article content here..."
    />
  )
}

// Note: This is a simple implementation using a textarea
// In a production environment, you might want to integrate a proper rich text editor 
// like TipTap, Slate, or CKEditor for a better user experience. 