import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Pipette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string; // Hex color
  onChange: (color: string) => void;
  onClose: () => void;
  label?: string;
}

// Convert hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, v: 100 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, v: v * 100 };
}

// Convert HSV to hex
function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Photoshop-style color picker - Optimized for performance
 * Only applies changes on mouse release or Apply button
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  color, 
  onChange, 
  onClose,
  label = 'Pick a Color'
}) => {
  // All state is local - only calls onChange on Apply
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color.replace('#', '').toUpperCase());
  const [rgb, setRgb] = useState(() => hexToRgb(color));
  
  const satBrightRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<'sb' | 'hue' | null>(null);
  
  // Compute current hex from HSV (memoized inline)
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const pureHueColor = hsvToHex(hsv.h, 100, 100);
  
  // Sync hex input and RGB when HSV changes (local only, no external calls)
  useEffect(() => {
    const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
    setHexInput(hex.replace('#', '').toUpperCase());
    setRgb(hexToRgb(hex));
  }, [hsv]);
  
  // Handle saturation/brightness drag - direct DOM updates for smoothness
  const handleSBMove = useCallback((clientX: number, clientY: number) => {
    if (!satBrightRef.current) return;
    const rect = satBrightRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setHsv(prev => ({ ...prev, s: x * 100, v: (1 - y) * 100 }));
  }, []);
  
  // Handle hue drag
  const handleHueMove = useCallback((clientY: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setHsv(prev => ({ ...prev, h: y * 360 }));
  }, []);
  
  // Unified mouse/touch handlers
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      if (isDraggingRef.current === 'sb') {
        handleSBMove(clientX, clientY);
      } else if (isDraggingRef.current === 'hue') {
        handleHueMove(clientY);
      }
    };
    
    const handleUp = () => {
      isDraggingRef.current = null;
    };
    
    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handleSBMove, handleHueMove]);
  
  // Handle hex input change
  const handleHexChange = (value: string) => {
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '').slice(0, 6).toUpperCase();
    setHexInput(cleaned);
    
    if (cleaned.length === 6) {
      const newHsv = hexToHsv(`#${cleaned}`);
      setHsv(newHsv);
    }
  };
  
  // Handle RGB input change
  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgb, [channel]: num };
    setRgb(newRgb);
    
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex.replace('#', '').toUpperCase());
    setHsv(hexToHsv(hex));
  };
  
  const handleApply = () => {
    onChange(currentHex);
    onClose();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-popover border border-border rounded-xl shadow-2xl p-4 w-[300px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pipette className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-2">
        {/* Saturation/Brightness Square */}
        <div
          ref={satBrightRef}
          className="w-[220px] h-[180px] rounded-lg cursor-crosshair relative select-none touch-none"
          style={{
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pureHueColor})`
          }}
          onMouseDown={(e) => {
            isDraggingRef.current = 'sb';
            handleSBMove(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            isDraggingRef.current = 'sb';
            handleSBMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
        >
          {/* Picker Circle */}
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)'
            }}
          />
        </div>
        
        {/* Hue Slider */}
        <div
          ref={hueRef}
          className="w-4 h-[180px] rounded-lg cursor-pointer relative select-none touch-none"
          style={{
            background: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
          }}
          onMouseDown={(e) => {
            isDraggingRef.current = 'hue';
            handleHueMove(e.clientY);
          }}
          onTouchStart={(e) => {
            isDraggingRef.current = 'hue';
            handleHueMove(e.touches[0].clientY);
          }}
        >
          {/* Hue Indicator */}
          <div
            className="absolute left-[-2px] right-[-2px] h-2 border-2 border-white rounded pointer-events-none"
            style={{
              top: `${(hsv.h / 360) * 100}%`,
              transform: 'translateY(-50%)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      </div>
      
      {/* Color Preview */}
      <div className="flex gap-2 mt-3">
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground mb-1">New</div>
          <div className="h-8 rounded border border-border" style={{ backgroundColor: currentHex }} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground mb-1">Current</div>
          <div className="h-8 rounded border border-border" style={{ backgroundColor: color }} />
        </div>
      </div>
      
      {/* Hex + RGB Inputs - Compact */}
      <div className="mt-3 flex gap-2">
        {/* Hex */}
        <div className="flex-1">
          <div className="flex items-center bg-muted/50 border border-border rounded px-2 py-1.5">
            <span className="text-xs text-muted-foreground mr-1">#</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-full bg-transparent text-xs font-mono uppercase tracking-wider focus:outline-none"
              maxLength={6}
            />
          </div>
        </div>
        
        {/* RGB */}
        {(['r', 'g', 'b'] as const).map((channel) => (
          <div key={channel} className="w-12">
            <input
              type="number"
              min={0}
              max={255}
              value={rgb[channel]}
              onChange={(e) => handleRgbChange(channel, e.target.value)}
              className="w-full px-1.5 py-1.5 bg-muted/50 border border-border rounded text-xs font-mono text-center focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          Apply
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Small color swatch button that opens the picker
 */
interface ColorSwatchProps {
  color: string;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({ 
  color, 
  onClick, 
  size = 'md',
  label 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-105 shadow-sm",
        sizeClasses[size]
      )}
      style={{ backgroundColor: color }}
      title={label || `Color: ${color}`}
    />
  );
};
