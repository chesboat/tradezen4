import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
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

interface TipTapEditorProps {
  initialJSON?: any;
  onUpdateJSON?: (json: any, plainText: string) => void;
  placeholder?: string;
  className?: string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  initialJSON,
  onUpdateJSON,
  placeholder,
  className,
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
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TipTapEditor;


