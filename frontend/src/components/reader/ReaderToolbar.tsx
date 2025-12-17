'use client';

import { cn } from '@/lib/utils';
import { Minus, Plus, Type, Maximize2, Minimize2 } from 'lucide-react';

interface ReaderToolbarProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isImmersive: boolean;
  onImmersiveToggle: () => void;
  className?: string;
}

export function ReaderToolbar({
  fontSize,
  onFontSizeChange,
  isImmersive,
  onImmersiveToggle,
  className,
}: ReaderToolbarProps) {
  const minFontSize = 14;
  const maxFontSize = 28;

  const decreaseFontSize = () => {
    if (fontSize > minFontSize) {
      onFontSizeChange(fontSize - 2);
    }
  };

  const increaseFontSize = () => {
    if (fontSize < maxFontSize) {
      onFontSizeChange(fontSize + 2);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border',
        className
      )}
    >
      {/* 字体大小控制 */}
      <div className="flex items-center gap-1">
        <Type className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={decreaseFontSize}
          disabled={fontSize <= minFontSize}
          className={cn(
            'p-1.5 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
          title="减小字体"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{fontSize}</span>
        <button
          onClick={increaseFontSize}
          disabled={fontSize >= maxFontSize}
          className={cn(
            'p-1.5 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
          title="增大字体"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* 沉浸模式切换 */}
      <button
        onClick={onImmersiveToggle}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded',
          'hover:bg-accent transition-colors',
          isImmersive && 'bg-accent'
        )}
        title={isImmersive ? '退出沉浸模式' : '进入沉浸模式'}
      >
        {isImmersive ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
        <span className="text-sm hidden sm:inline">
          {isImmersive ? '退出沉浸' : '沉浸模式'}
        </span>
      </button>
    </div>
  );
}
