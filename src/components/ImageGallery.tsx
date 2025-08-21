import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';

interface ImageGalleryProps {
  images: string[];
  onRemoveImage?: (index: number) => void;
  className?: string;
  readOnly?: boolean;
  maxDisplayCount?: number;
}

// Resolve Firebase Storage URLs that may need signed URL conversion
const ResolvedImage: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string; 
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
}> = ({ src, alt, className, onClick, loading = 'lazy' }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const needsResolution = /\/o\?name=/.test(src) && !/alt=media/.test(src);
    if (!needsResolution) {
      setResolvedSrc(src);
      return;
    }

    try {
      const url = new URL(src);
      const pathParam = url.searchParams.get('name');
      if (!pathParam) {
        setResolvedSrc(src);
        return;
      }

      const storage = getStorage(app as any);
      const storagePath = decodeURIComponent(pathParam);
      const storageRef = ref(storage, storagePath);
      getDownloadURL(storageRef)
        .then((dl) => {
          if (isMounted) setResolvedSrc(dl);
        })
        .catch(() => {
          if (isMounted) setResolvedSrc(src);
        });
    } catch {
      setResolvedSrc(src);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onClick={onClick}
    />
  );
};

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onRemoveImage?: (index: number) => void;
  readOnly?: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  onRemoveImage,
  readOnly = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
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

  const handleRemove = () => {
    if (onRemoveImage && !readOnly) {
      onRemoveImage(currentIndex);
      if (images.length === 1) {
        onClose();
      } else if (currentIndex === images.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
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
              <span className="text-sm font-medium">
                {currentIndex + 1} of {images.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
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
              
              {!readOnly && onRemoveImage && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
              
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

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </>
          )}

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ResolvedImage
              src={images[currentIndex]}
              alt={`Trade chart ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              loading="eager"
            />
          </motion.div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg">
              {images.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-12 h-12 rounded overflow-hidden border-2 transition-all",
                    index === currentIndex
                      ? "border-white shadow-lg"
                      : "border-white/30 hover:border-white/60"
                  )}
                >
                  <ResolvedImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onRemoveImage,
  className,
  readOnly = false,
  maxDisplayCount = 4
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const displayImages = images.slice(0, maxDisplayCount);
  const remainingCount = images.length - maxDisplayCount;

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const handleRemoveImage = (index: number) => {
    if (onRemoveImage && !readOnly) {
      onRemoveImage(index);
    }
  };

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            📊 Trade Charts & Screenshots
            <span className="text-xs text-muted-foreground">({images.length})</span>
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {displayImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-video bg-muted rounded-lg overflow-hidden border border-border/50 hover:border-border transition-all"
            >
              <ResolvedImage
                src={image}
                alt={`Trade chart ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openModal(index)}
                    className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-800 shadow-lg"
                    title="View full size"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </motion.button>
                  
                  {!readOnly && onRemoveImage && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-red-500/90 hover:bg-red-500 rounded-full text-white shadow-lg"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Image number badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                {index + 1}
              </div>
            </motion.div>
          ))}

          {/* Show more indicator */}
          {remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: displayImages.length * 0.1 }}
              className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => openModal(maxDisplayCount)}
            >
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  +{remainingCount} more
                </p>
                <p className="text-xs text-muted-foreground">Click to view all</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        images={images}
        initialIndex={selectedImageIndex || 0}
        isOpen={selectedImageIndex !== null}
        onClose={closeModal}
        onRemoveImage={handleRemoveImage}
        readOnly={readOnly}
      />
    </>
  );
};
