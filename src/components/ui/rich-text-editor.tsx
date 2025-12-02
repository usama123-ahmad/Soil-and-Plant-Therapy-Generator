import * as React from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Palette } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, className, placeholder = "Start typing...", ...props }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        TextStyle,
        Color,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-[#8cb43a] hover:underline cursor-pointer',
          },
        }),
        Placeholder.configure({
          placeholder: placeholder,
        }),
      ],
      content: value || '',
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2 relative',
        },
      },
    })

    React.useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value || '', { emitUpdate: false })
      }
    }, [value, editor])

    if (!editor) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col rounded-md border border-input bg-background ring-offset-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary/50 transition-colors overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-input bg-muted/50 rounded-t-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('bold') && "bg-background"
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('italic') && "bg-background"
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('bulletList') && "bg-background"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('orderedList') && "bg-background"
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 relative",
                  editor.isActive('textStyle') && editor.getAttributes('textStyle').color && "bg-background"
                )}
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
                {editor.getAttributes('textStyle').color && (
                  <div
                    className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white"
                    style={{ backgroundColor: editor.getAttributes('textStyle').color }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Text Color</div>
                  {editor.getAttributes('textStyle').color && (
                    <div className="text-xs text-muted-foreground">
                      Current: <span className="font-mono">{editor.getAttributes('textStyle').color}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
                    '#808080', '#000080', '#008000', '#800000', '#008080', '#8cb43a'
                  ].map((color) => {
                    const isActive = editor.getAttributes('textStyle').color === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().setColor(color).run()
                        }}
                        className={cn(
                          "w-8 h-8 rounded border-2 transition-all hover:scale-110",
                          isActive && "border-primary ring-2 ring-primary ring-offset-1"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    type="color"
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    onChange={(e) => {
                      editor.chain().focus().setColor(e.target.value).run()
                    }}
                    className="w-full h-8 rounded border cursor-pointer"
                    title="Custom Color"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run()
                    }}
                    className="text-xs whitespace-nowrap"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('link') && "bg-background"
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Editor */}
        <div className="bg-white rounded-b-md relative">
          <EditorContent editor={editor} />
          <style>{`
            .ProseMirror p.is-editor-empty:first-child::before {
              content: attr(data-placeholder);
              float: left;
              color: hsl(var(--muted-foreground) / 0.6);
              pointer-events: none;
              height: 0;
            }
            .ProseMirror a {
              color: #8cb43a;
              text-decoration: none;
            }
            .ProseMirror a:hover {
              text-decoration: underline;
            }
            .ProseMirror ul,
            .ProseMirror ol {
              padding-left: 1.5rem;
              margin: 0.5rem 0;
            }
            .ProseMirror ul {
              list-style-type: disc;
            }
            .ProseMirror ol {
              list-style-type: decimal;
            }
            .ProseMirror p {
              margin: 0.5rem 0;
            }
            .ProseMirror p:first-child {
              margin-top: 0;
            }
            .ProseMirror p:last-child {
              margin-bottom: 0;
            }
          `}</style>
        </div>
      </div>
    )
  }
)

RichTextEditor.displayName = "RichTextEditor"

export { RichTextEditor }

