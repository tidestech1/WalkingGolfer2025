'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Blockquote from '@tiptap/extension-blockquote'
import CodeBlock from '@tiptap/extension-code-block'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Strike from '@tiptap/extension-strike'
import { 
  Bold, Italic, Pilcrow, List, ListOrdered, Heading2, Heading1, Heading3,
  Image as ImageIcon, Link as LinkIcon, Table as TableIcon, Quote, 
  Code, Minus, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify
} from 'lucide-react'

interface RichTextEditorProps {
  initialValue: string
  onChange: (value: string) => void
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  
  if (!editor) {
    return null
  }

  const iconSize = 18
  const buttonClass = "p-2 rounded hover:bg-gray-200 disabled:opacity-50"
  const activeClass = "bg-gray-200"

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: 'Image' }).run()
    }
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setShowLinkDialog(true)
  }

  const setLink = () => {
    if (linkUrl === null) {
      return
    }

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    setShowLinkDialog(false)
    setLinkUrl('')
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="border border-gray-300 border-b-0 p-2 rounded-t-md bg-gray-50">
      <div className="flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 mr-2">
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
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`${buttonClass} ${editor.isActive('strike') ? activeClass : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={iconSize} />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-1 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? activeClass : ''}`}
            title="Heading 1"
          >
            <Heading1 size={iconSize} />
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
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`${buttonClass} ${editor.isActive('heading', { level: 3 }) ? activeClass : ''}`}
            title="Heading 3"
          >
            <Heading3 size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`${buttonClass} ${editor.isActive('paragraph') ? activeClass : ''}`}
            title="Paragraph"
          >
            <Pilcrow size={iconSize} />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1 mr-2">
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
            title="Numbered List"
          >
            <ListOrdered size={iconSize} />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`${buttonClass} ${editor.isActive({ textAlign: 'left' }) ? activeClass : ''}`}
            title="Align Left"
          >
            <AlignLeft size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`${buttonClass} ${editor.isActive({ textAlign: 'center' }) ? activeClass : ''}`}
            title="Align Center"
          >
            <AlignCenter size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`${buttonClass} ${editor.isActive({ textAlign: 'right' }) ? activeClass : ''}`}
            title="Align Right"
          >
            <AlignRight size={iconSize} />
          </button>
        </div>

        {/* Content Elements */}
        <div className="flex items-center space-x-1 mr-2">
          <button
            type="button"
            onClick={addImage}
            className={`${buttonClass}`}
            title="Insert Image"
          >
            <ImageIcon size={iconSize} />
          </button>
          <button
            type="button"
            onClick={addLink}
            className={`${buttonClass} ${editor.isActive('link') ? activeClass : ''}`}
            title="Insert Link"
          >
            <LinkIcon size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${buttonClass} ${editor.isActive('blockquote') ? activeClass : ''}`}
            title="Quote"
          >
            <Quote size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`${buttonClass} ${editor.isActive('codeBlock') ? activeClass : ''}`}
            title="Code Block"
          >
            <Code size={iconSize} />
          </button>
          <button
            type="button"
            onClick={insertTable}
            className={`${buttonClass}`}
            title="Insert Table"
          >
            <TableIcon size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={`${buttonClass}`}
            title="Horizontal Rule"
          >
            <Minus size={iconSize} />
          </button>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="mt-2 p-3 bg-white border rounded-md">
          <div className="flex items-center space-x-2">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setLink()
                }
                if (e.key === 'Escape') {
                  setShowLinkDialog(false)
                  setLinkUrl('')
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={setLink}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkDialog(false)
                setLinkUrl('')
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RichTextEditor({ initialValue, onChange }: RichTextEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Blockquote,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 rounded p-2 font-mono text-sm',
        },
      }),
      HorizontalRule,
      Strike,
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
      <div className="border-t border-gray-300">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none p-3 min-h-[12rem] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 enhanced-editor"
        />
      </div>
      <style jsx global>{`
        .enhanced-editor .ProseMirror {
          outline: none;
        }
        
        .enhanced-editor .ProseMirror table {
          border-collapse: collapse;
          margin: 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }
        
        .enhanced-editor .ProseMirror table td,
        .enhanced-editor .ProseMirror table th {
          border: 2px solid #ced4da;
          box-sizing: border-box;
          min-width: 1em;
          padding: 3px 5px;
          position: relative;
          vertical-align: top;
        }
        
        .enhanced-editor .ProseMirror table th {
          font-weight: bold;
          text-align: left;
          background-color: #f8f9fa;
        }
        
        .enhanced-editor .ProseMirror table .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        
        .enhanced-editor .ProseMirror .tableWrapper {
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .enhanced-editor .ProseMirror blockquote {
          border-left: 4px solid #ddd;
          margin: 1rem 0;
          padding-left: 1rem;
          font-style: italic;
          color: #666;
        }
        
        .enhanced-editor .ProseMirror pre {
          background: #f8f9fa;
          border-radius: 0.375rem;
          color: #333;
          font-family: 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace;
          padding: 0.75rem 1rem;
          white-space: pre-wrap;
        }
        
        .enhanced-editor .ProseMirror code {
          background-color: #f1f5f9;
          border-radius: 0.25rem;
          color: #1e293b;
          font-size: 0.875em;
          padding: 0.125rem 0.25rem;
        }
        
        .enhanced-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #ddd;
          margin: 2rem 0;
        }
        
        .enhanced-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        
        .enhanced-editor .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1.5rem 0 1rem 0;
        }
        
        .enhanced-editor .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1.25rem 0 0.75rem 0;
        }
        
        .enhanced-editor .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        
        .enhanced-editor .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        
        .enhanced-editor .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        
        .enhanced-editor .ProseMirror li {
          margin: 0 !important;
          margin-bottom: 0.125rem !important;
          display: list-item;
          line-height: 1.375 !important;
        }
        
        .enhanced-editor .ProseMirror ul ul {
          list-style-type: circle !important;
          margin: 0.25rem 0 !important;
        }
        
        .enhanced-editor .ProseMirror ul ul ul {
          list-style-type: square !important;
        }
      `}</style>
    </div>
  )
}

// Note: This now uses TipTap for a basic rich text editing experience.
// You can extend it with more features and a more sophisticated toolbar as needed. 