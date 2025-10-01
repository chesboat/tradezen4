import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { TooltipProps } from '@/types';

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  wrapperClassName,
  fullWidth
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = rect.left + scrollX + rect.width / 2;
          y = rect.top + scrollY - 8;
          break;
        case 'bottom':
          x = rect.left + scrollX + rect.width / 2;
          y = rect.bottom + scrollY + 8;
          break;
        case 'left':
          x = rect.left + scrollX - 8;
          y = rect.top + scrollY + rect.height / 2;
          break;
        case 'right':
          x = rect.right + scrollX + 8;
          y = rect.top + scrollY + rect.height / 2;
          break;
      }

      setTooltipPosition({ x, y });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.15,
        ease: 'easeOut'
      }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.15,
        ease: 'easeOut'
      }
    }
  };

  const getTransformOrigin = () => {
    switch (position) {
      case 'top':
        return 'bottom center';
      case 'bottom':
        return 'top center';
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
      default:
        return 'bottom center';
    }
  };

  const getTooltipClasses = () => {
    // Apple-style: Allow multi-line, centered text with proper spacing
    // pointer-events-none prevents tooltip from blocking hover on trigger element
    const baseClasses = 'absolute z-[9999] px-3 py-2 text-xs font-medium text-white bg-dark-800 rounded-lg shadow-lg border border-dark-600 whitespace-pre-line text-center max-w-xs pointer-events-none';
    
    switch (position) {
      case 'top':
        return `${baseClasses} -translate-x-1/2 -translate-y-full`;
      case 'bottom':
        return `${baseClasses} -translate-x-1/2 translate-y-0`;
      case 'left':
        return `${baseClasses} -translate-x-full -translate-y-1/2`;
      case 'right':
        return `${baseClasses} translate-x-0 -translate-y-1/2`;
      default:
        return `${baseClasses} -translate-x-1/2 -translate-y-full`;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={wrapperClassName || (fullWidth ? 'block w-full' : 'inline-block')}
      >
        {children}
      </div>
      
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              className={getTooltipClasses()}
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transformOrigin: getTransformOrigin(),
              }}
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}; 