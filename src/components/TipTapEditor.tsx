import React from 'react';
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommand from './editor/SlashCommand';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Heading from '@tiptap/extension-heading';
import CodeBlock from '@tiptap/extension-code-block';

interface TipTapEditorProps {
  initialJSON?: any;
  onUpdateJSON?: (json: any, plainText: string) => void;
  placeholder?: string;
  className?: string;
  onConvertSelectionToInsight?: (text: string) => void;
  onPinSelectionAsQuest?: (text: string) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  initialJSON,
  onUpdateJSON,
  placeholder,
  className,
  onConvertSelectionToInsight,
  onPinSelectionAsQuest,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlock,
      Underline,
      Link.configure({ openOnClick: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      BulletList,
      OrderedList,
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({ placeholder: placeholder || 'Write your thoughts…' }),
      SlashCommand({
        onInsight: (text) => onConvertSelectionToInsight?.(text),
        onTradeLink: (href) => {
          if (!editor) return;
          editor.chain().focus().setLink({ href }).run();
        },
      }),
    ],
    content: initialJSON || '<p></p>',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      onUpdateJSON?.(json, text);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  });

  return (
    <div className={className}>
      <div className="border border-border rounded-lg p-3 bg-background">
        {/* Simple persistent toolbar for reliability/debug */}
        {editor && (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <button className="px-2 py-1 bg-muted hover:bg-muted/70 rounded" onMouseDown={(e)=>{e.preventDefault(); const ok=editor.chain().focus().toggleBold().run(); console.log('[Toolbar] bold', ok);}}>B</button>
            <button className="px-2 py-1 bg-muted hover:bg-muted/70 rounded italic" onMouseDown={(e)=>{e.preventDefault(); const ok=editor.chain().focus().toggleItalic().run(); console.log('[Toolbar] italic', ok);}}>I</button>
            <button className="px-2 py-1 bg-muted hover:bg-muted/70 rounded underline" onMouseDown={(e)=>{e.preventDefault(); const ok=editor.chain().focus().toggleUnderline().run(); console.log('[Toolbar] underline', ok);}}>U</button>
            <button className="px-2 py-1 bg-muted hover:bg-muted/70 rounded" onMouseDown={(e)=>{e.preventDefault(); const ok=editor.chain().focus().toggleBulletList().run(); console.log('[Toolbar] bullet', ok);}}>•</button>
            <button className="px-2 py-1 bg-muted hover:bg-muted/70 rounded" onMouseDown={(e)=>{e.preventDefault(); const ok=editor.chain().focus().toggleOrderedList().run(); console.log('[Toolbar] ordered', ok);}}>1.</button>
            <button className="px-2 py-1 bg-muted hover:bg-muted/70 rounded" onMouseDown={(e)=>{e.preventDefault(); const ok=editor.chain().focus().toggleTaskList().run(); console.log('[Toolbar] tasks', ok);}}>☑︎</button>
            <button className="ml-2 px-2 py-1 bg-muted hover:bg-muted/70 rounded" onMouseDown={(e)=>{e.preventDefault(); const href=prompt('Link to (URL or #trade:ID)'); if(!href) return; const {from,to}=editor.state.selection; let ok=false; if(to>from){ ok=editor.chain().focus().setLink({href}).run(); } else { ok=editor.chain().focus().setMark('link',{href}).insertContent('trade').unsetMark('link').run(); } console.log('[Toolbar] link', ok, href);}}>Link</button>
          </div>
        )}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 150, appendTo: () => document.body, zIndex: 9999 }}
            shouldShow={({ editor }) => {
              const { from, to } = editor.state.selection;
              return editor.isFocused && to > from;
            }}
            className="flex items-center gap-1 bg-popover text-popover-foreground border border-border rounded-lg px-2 py-1 shadow"
          >
            <button className="text-xs px-2 py-1 hover:bg-muted rounded" onMouseDown={(e)=>{e.preventDefault(); editor.chain().focus().toggleBold().run();}}>Bold</button>
            <button className="text-xs px-2 py-1 hover:bg-muted rounded" onMouseDown={(e)=>{e.preventDefault(); editor.chain().focus().toggleItalic().run();}}>Italic</button>
            <button className="text-xs px-2 py-1 hover:bg-muted rounded" onMouseDown={(e)=>{e.preventDefault(); editor.chain().focus().toggleUnderline().run();}}>Underline</button>
            <span className="mx-1 h-4 w-px bg-border" />
            <button className="text-xs px-2 py-1 hover:bg-muted rounded" onMouseDown={(e)=>{e.preventDefault(); editor.chain().focus().toggleBulletList().run();}}>• List</button>
            <button className="text-xs px-2 py-1 hover:bg-muted rounded" onMouseDown={(e)=>{e.preventDefault(); editor.chain().focus().toggleOrderedList().run();}}>1. List</button>
            <button className="text-xs px-2 py-1 hover:bg-muted rounded" onMouseDown={(e)=>{e.preventDefault(); editor.chain().focus().toggleTaskList().run();}}>☑︎ Tasks</button>
            <span className="mx-1 h-4 w-px bg-border" />
            <button
              className="text-xs px-2 py-1 hover:bg-muted rounded"
              onMouseDown={(e) => {
                e.preventDefault();
                const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to).trim();
                if (sel) onConvertSelectionToInsight?.(sel);
              }}
            >Insight</button>
            <button
              className="text-xs px-2 py-1 hover:bg-muted rounded"
              onMouseDown={(e) => {
                e.preventDefault();
                const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to).trim();
                if (sel) onPinSelectionAsQuest?.(sel);
              }}
            >Pin Quest</button>
            <button
              className="text-xs px-2 py-1 hover:bg-muted rounded"
              onMouseDown={(e) => {
                e.preventDefault();
                const href = window.prompt('Link to (URL or trade id e.g. #trade:abc123):');
                if (!href) return;
                editor.chain().focus().setLink({ href }).run();
              }}
            >Link</button>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TipTapEditor;


