import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  X,
  Star,
  Trash2,
  GripVertical,
  Settings,
  Info,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { FavoriteBlock } from '@/types';
import { cn } from '@/lib/utils';

interface FavoritesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  isOpen,
  onClose,
  className,
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const {
    getFavoriteBlocks,
    updateFavoritesOrder,
    removeFavoriteBlock,
    getTemplateById,
  } = useReflectionTemplateStore();

  const [favorites, setFavorites] = useState<FavoriteBlock[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load favorites when modal opens
  React.useEffect(() => {
    if (isOpen && selectedAccountId) {
      const userFavorites = getFavoriteBlocks(selectedAccountId);
      setFavorites([...userFavorites]);
      setHasChanges(false);
    }
  }, [isOpen, selectedAccountId, getFavoriteBlocks]);

  const handleReorder = (newOrder: FavoriteBlock[]) => {
    setFavorites(newOrder);
    setHasChanges(true);
  };

  const handleRemoveFavorite = (favoriteId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedAccountId || !hasChanges) return;

    // Get current favorites from store
    const currentFavorites = getFavoriteBlocks(selectedAccountId);
    
    // Remove favorites that were deleted in the UI
    const deletedFavorites = currentFavorites.filter(
      current => !favorites.find(f => f.id === current.id)
    );
    deletedFavorites.forEach(fav => removeFavoriteBlock(fav.id));

    // Update the order using the new batch update function
    updateFavoritesOrder(selectedAccountId, favorites);

    setHasChanges(false);
  };

  const handleReset = () => {
    if (selectedAccountId) {
      const userFavorites = getFavoriteBlocks(selectedAccountId);
      setFavorites([...userFavorites]);
      setHasChanges(false);
    }
  };

  const getTemplateInfo = (favorite: FavoriteBlock) => {
    const template = getTemplateById(favorite.templateId);
    return template;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Manage Favorite Blocks</h2>
              <p className="text-sm text-muted-foreground">
                Reorder your pinned blocks for daily auto-loading
              </p>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Favorite Blocks</h3>
              <p className="text-muted-foreground mb-4">
                Star template blocks from the "Add Block" dropdown to have them auto-load for new days.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 max-w-md mx-auto">
                <Info className="w-4 h-4" />
                <span>Click the star icons next to template blocks to add them here</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Your Favorite Blocks ({favorites.length})
                </h3>
                <div className="text-sm text-muted-foreground">
                  Drag to reorder • Auto-loads for new days
                </div>
              </div>

              <Reorder.Group
                axis="y"
                values={favorites}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {favorites.map((favorite, index) => {
                  const template = getTemplateInfo(favorite);
                  
                  return (
                    <Reorder.Item
                      key={favorite.id}
                      value={favorite}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <motion.div
                        layout
                        className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          {/* Drag Handle */}
                          <div className="flex items-center gap-2 pt-1">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <div className="w-6 h-6 bg-muted/30 rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                              {index + 1}
                            </div>
                          </div>

                          {/* Block Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{favorite.emoji}</span>
                              <h4 className="font-medium truncate">{favorite.title}</h4>
                              {template && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                  {template.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {favorite.prompt}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <motion.button
                              onClick={() => handleRemoveFavorite(favorite.id)}
                              className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Remove from favorites"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm text-orange-800">
                    <Settings className="w-4 h-4" />
                    <span>You have unsaved changes to your favorite blocks order</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
            <div className="text-sm text-muted-foreground">
              {hasChanges ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  Unsaved changes
                </span>
              ) : (
                <span>Changes are saved automatically</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <motion.button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </motion.button>
              )}
              
              <motion.button
                onClick={hasChanges ? handleSave : onClose}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {hasChanges ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  'Done'
                )}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};