import React, { useState, useRef, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Heading from '@tiptap/extension-heading';
import CodeBlock from '@tiptap/extension-code-block';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Image as ImageIcon,
  Upload,
  Type
} from 'lucide-react';
import { CustomImage } from './editor/CustomImage';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { cn } from '@/lib/utils';

interface EnhancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const EnhancedRichTextEditor: React.FC<EnhancedRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your thoughts...",
  className
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const uploadImage = useQuickNoteStore(state => state.uploadImage);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false,
        heading: false // We'll configure this separately
      }),
      CodeBlock,
      Underline,
      Link.configure({ openOnClick: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      BulletList,
      OrderedList,
      Heading.configure({ 
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'tiptap-heading'
        }
      }),
      Placeholder.configure({ placeholder }),
      CustomImage,
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        // Light mode: prose (black text), Dark mode: invert
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3',
      },
      handlePaste: (view, event, slice) => {
        // Intercept paste events to handle images properly
        console.log('🔧 EnhancedRichTextEditor: Paste event detected', { 
          clipboardData: !!event.clipboardData,
          itemCount: event.clipboardData?.items?.length || 0
        });
        
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
          console.log('🔧 EnhancedRichTextEditor: Image found in paste, intercepting', { type: imageItem.type });
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          return true; // Prevent default paste behavior
        }
        
        console.log('🔧 EnhancedRichTextEditor: No image in paste, allowing default behavior');
        return false; // Allow default paste behavior for non-images
      },
    },
    onFocus: () => setShowToolbar(true),
    onBlur: ({ event }) => {
      // Keep toolbar open if clicking on toolbar buttons
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (!relatedTarget || !relatedTarget.closest('.editor-toolbar')) {
        setTimeout(() => setShowToolbar(false), 150);
      }
    },
  });

  // Sync content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  // Ensure toolbar appears when user selects text even if focus handling is missed
  useEffect(() => {
    if (!editor) return;
    const handler = () => setShowToolbar(true);
    editor.on('selectionUpdate', handler);
    editor.on('focus', handler);
    return () => {
      editor.off('selectionUpdate', handler);
      editor.off('focus', handler);
    };
  }, [editor]);

  const handleImageUpload = async (file: File) => {
    if (!editor) return;
    
    console.log('🔧 EnhancedRichTextEditor: Starting image upload', { fileName: file.name, fileSize: file.size });
    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      console.log('🔧 EnhancedRichTextEditor: Image uploaded successfully', { imageUrl });
      editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: imageUrl } }).run();
    } catch (error) {
      console.error('🚨 EnhancedRichTextEditor: Failed to upload image:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle drag-and-drop of images into the editor
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer || !editor) return;

    console.log('🔧 EnhancedRichTextEditor: Drop event detected', {
      fileCount: e.dataTransfer.files?.length || 0,
      hasDataTransfer: !!e.dataTransfer
    });

    const files = Array.from(e.dataTransfer.files || []);
    const image = files.find((f) => f.type && f.type.startsWith('image/'));
    if (image) {
      console.log('🔧 EnhancedRichTextEditor: Image file dropped', { fileName: image.name, type: image.type });
      await handleImageUpload(image);
      setIsDragOver(false);
      dragCounter.current = 0;
      return;
    }

    // Optional: if a URL is dropped, try to insert as image
    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (uri && /^https?:\/\//.test(uri)) {
      console.log('🔧 EnhancedRichTextEditor: URL dropped as image', { uri });
      editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: uri } }).run();
    }
    setIsDragOver(false);
    dragCounter.current = 0;
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any; 
    title: string; 
  }) => (
    <motion.button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "p-2 rounded-lg transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );

  if (!editor) return null;

  return (
    <div className={cn("relative border border-border rounded-lg bg-background", className)}>
      {/* Pinned Toolbar */}
      <div className="editor-toolbar sticky top-0 z-50 px-2 pt-2">
        <div className="flex items-center gap-1 p-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
              {/* Text Formatting */}
              <div className="flex items-center gap-1 pr-2 border-r border-border">
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  isActive={editor.isActive('bold')}
                  icon={Bold}
                  title="Bold"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  isActive={editor.isActive('italic')}
                  icon={Italic}
                  title="Italic"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  isActive={editor.isActive('underline')}
                  icon={UnderlineIcon}
                  title="Underline"
                />
              </div>

              {/* Headings */}
              <div className="flex items-center gap-1 pr-2 border-r border-border">
                <ToolbarButton
                  onClick={() => editor.chain().focus().setNode('paragraph').setHeading({ level: 1 }).run()}
                  isActive={editor.isActive('heading', { level: 1 })}
                  icon={Heading1}
                  title="Heading 1"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().setNode('paragraph').setHeading({ level: 2 }).run()}
                  isActive={editor.isActive('heading', { level: 2 })}
                  icon={Heading2}
                  title="Heading 2"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().setNode('paragraph').setHeading({ level: 3 }).run()}
                  isActive={editor.isActive('heading', { level: 3 })}
                  icon={Heading3}
                  title="Heading 3"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  isActive={editor.isActive('paragraph')}
                  icon={Type}
                  title="Paragraph"
                />
              </div>

              {/* Lists */}
              <div className="flex items-center gap-1 pr-2 border-r border-border">
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  isActive={editor.isActive('bulletList')}
                  icon={List}
                  title="Bullet List"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  isActive={editor.isActive('orderedList')}
                  icon={ListOrdered}
                  title="Numbered List"
                />
              </div>

              {/* Image Upload */}
              <div className="flex items-center gap-1">
                <motion.button
                  onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                  disabled={isUploadingImage}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isUploadingImage
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  whileHover={!isUploadingImage ? { scale: 1.05 } : {}}
                  whileTap={!isUploadingImage ? { scale: 0.95 } : {}}
                  title="Add image"
                >
                  {isUploadingImage ? (
                    <Upload className="w-4 h-4 animate-pulse" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </motion.button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
        </div>
      </div>

      {/* Editor */}
      <div
        className="relative"
        style={{ marginTop: '8px' }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current += 1; setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current -= 1; if (dragCounter.current <= 0) { setIsDragOver(false); dragCounter.current = 0; } }}
        onDrop={handleDrop}
      >
        <EditorContent 
          editor={editor} 
          className="prose-headings:font-semibold prose-h1:text-xl prose-h1:mb-2 prose-h2:text-lg prose-h2:mb-2 prose-h3:text-base prose-h3:mb-1 transition-all duration-200"
        />

        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-card/90 text-foreground text-sm shadow">
              Drop image to insert
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
