import { useState } from 'react';
import { Trade } from '@/types';

export const useTradeLoggerModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const openModal = (trade?: Trade) => {
    if (trade) {
      setEditingTrade(trade);
    } else {
      setEditingTrade(null);
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingTrade(null);
  };

  const openForEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setIsOpen(true);
  };

  const openForNew = () => {
    setEditingTrade(null);
    setIsOpen(true);
  };

  return {
    isOpen,
    editingTrade,
    openModal,
    closeModal,
    openForEdit,
    openForNew,
  };
}; 