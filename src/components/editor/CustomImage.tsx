import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, Trash2 } from 'lucide-react';
import { InlineImageModal } from '../InlineImageModal';

interface ImageComponentProps {
  node: any;
  updateAttributes: (attributes: any) => void;
  deleteNode: () => void;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const { src, alt, title } = node.attrs;

  return (
    <NodeViewWrapper className="inline-image-wrapper">
      <div 
        className="relative inline-block group max-w-full"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <motion.img
          src={src}
          alt={alt}
          title={title}
          className="max-w-full h-auto rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition-all"
          style={{ maxHeight: '300px' }}
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Overlay controls */}
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-800 shadow-lg"
              title="View full size"
            >
              <ZoomIn className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={deleteNode}
              className="p-2 bg-red-500/90 hover:bg-red-500 rounded-full text-white shadow-lg"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
        
        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Click to expand
        </div>
      </div>
      
      <InlineImageModal
        src={src}
        alt={alt || 'Trade chart'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </NodeViewWrapper>
  );
};

export const CustomImage = Node.create({
  name: 'customImage',
  
  group: 'inline',
  
  inline: true,
  
  atom: true,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
  
  addCommands() {
    return {
      setImage: (options: { src: string; alt?: string; title?: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
