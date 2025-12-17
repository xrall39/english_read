'use client';

import { cn } from '@/lib/utils';

interface ReadingProgressProps {
  progress: number; // 0-100
  className?: string;
}

export function ReadingProgress({ progress, className }: ReadingProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">阅读进度</span>
        <span className="text-xs font-medium">{Math.round(clampedProgress)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
