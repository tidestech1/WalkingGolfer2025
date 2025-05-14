'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Pilcrow, List, ListOrdered, Heading2 } from 'lucide-react' // Using lucide-react for icons

interface RichTextEditorProps {
  initialValue: string
  onChange: (value: string) => void
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  const iconSize = 18
  const buttonClass = "p-2 rounded hover:bg-gray-200 disabled:opacity-50"
  const activeClass = "bg-gray-200"

  return (
    <div className="flex items-center space-x-1 border border-gray-300 border-b-0 p-2 rounded-t-md bg-gray-50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${buttonClass} ${editor.isActive('bold') ? activeClass : ''}`}
        title="Bold"
      >
        <Bold size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${buttonClass} ${editor.isActive('italic') ? activeClass : ''}`}
        title="Italic"
      >
        <Italic size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`${buttonClass} ${editor.isActive('paragraph') ? activeClass : ''}`}
        title="Paragraph"
      >
        <Pilcrow size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`}
        title="Heading 2"
      >
        <Heading2 size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${buttonClass} ${editor.isActive('bulletList') ? activeClass : ''}`}
        title="Bullet List"
      >
        <List size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonClass} ${editor.isActive('orderedList') ? activeClass : ''}`}
        title="Ordered List"
      >
        <ListOrdered size={iconSize} />
      </button>
    </div>
  )
}

export default function RichTextEditor({ initialValue, onChange }: RichTextEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit options if needed
        // For example, to disable some default features:
        // heading: { levels: [1, 2, 3] },
        // horizontalRule: false,
      }),
    ],
    content: initialValue || '',
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && initialValue !== editor.getHTML()) {
      // Use editor.commands.setContent to update editor content
      // This ensures proper handling by TipTap
      editor.commands.setContent(initialValue || '', false) // 'false' to not emit update
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when initialValue changes or editor is initialized
  }, [initialValue, editor])
  
  // Ensure editor is destroyed when component unmounts
  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  return (
    <div className="border border-gray-300 rounded-md shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-3 min-h-[12rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )
}

// Note: This now uses TipTap for a basic rich text editing experience.
// You can extend it with more features and a more sophisticated toolbar as needed. 