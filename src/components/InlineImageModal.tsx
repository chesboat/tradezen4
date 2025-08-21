import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface InlineImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InlineImageModal: React.FC<InlineImageModalProps> = ({
  src,
  alt,
  isOpen,
  onClose
}) => {
  const [zoom, setZoom] = useState(1);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-chart-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setZoom(prev => Math.min(prev + 0.25, 3));
    if (e.key === '-') setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm font-medium">Trade Chart Analysis</span>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(prev => Math.min(prev + 0.25, 3));
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(prev => Math.max(prev - 0.25, 0.5));
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Zoom indicator */}
          {zoom !== 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
              {Math.round(zoom * 100)}%
            </div>
          )}

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src={src}
              alt={alt}
              className="rounded-lg shadow-2xl cursor-move"
              style={{ 
                transform: `scale(${zoom})`,
                maxHeight: 'calc(90vh - 120px)',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
              animate={{ scale: zoom }}
              transition={{ duration: 0.2 }}
              draggable={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
