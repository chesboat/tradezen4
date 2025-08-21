import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  className?: string;
  disabled?: boolean;
  maxImages?: number;
  currentImages?: string[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  className,
  disabled = false,
  maxImages = 5,
  currentImages = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadMore = currentImages.length < maxImages;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canUploadMore) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Use the existing upload functionality from QuickNoteStore
      const { useQuickNoteStore } = await import('@/store/useQuickNoteStore');
      const uploadImage = useQuickNoteStore.getState().uploadImage;
      const imageUrl = await uploadImage(file);
      onImageUpload(imageUrl);
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || !canUploadMore) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && canUploadMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileSelect = () => {
    if (disabled || !canUploadMore) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-4 transition-all duration-200",
          isDragging && canUploadMore && !disabled
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-border/80",
          disabled || !canUploadMore
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-muted/30",
          uploadError && "border-red-500/50 bg-red-500/5"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || !canUploadMore}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-2 py-2"
            >
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading image...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload-area"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-2 py-2"
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isDragging && canUploadMore && !disabled
                  ? "bg-primary/20"
                  : "bg-muted/50"
              )}>
                {canUploadMore ? (
                  <Upload className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {canUploadMore 
                    ? "Drop image here or click to browse"
                    : `Maximum ${maxImages} images reached`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {canUploadMore 
                    ? "PNG, JPG, GIF up to 10MB"
                    : `${currentImages.length}/${maxImages} images uploaded`
                  }
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-3 h-3 text-red-500" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
