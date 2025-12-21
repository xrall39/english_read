/**
 * LearningControls 组件
 * 学习模式控制按钮
 */

'use client';

import { cn } from '@/lib/utils';
import { Settings, RotateCcw, X } from 'lucide-react';
import type { LearningMode } from '@/types/api';

interface LearningControlsProps {
  /** 当前学习模式 */
  mode: LearningMode;
  /** 模式切换回调 */
  onModeChange: (mode: LearningMode) => void;
  /** 重新开始回调 */
  onRestart?: () => void;
  /** 退出回调 */
  onExit?: () => void;
  /** 额外的类名 */
  className?: string;
}

export function LearningControls({
  mode,
  onModeChange,
  onRestart,
  onExit,
  className,
}: LearningControlsProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* 左侧：模式切换 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">模式:</span>
        <button
          onClick={() => onModeChange('simple')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            mode === 'simple'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          简单
        </button>
        <button
          onClick={() => onModeChange('advanced')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            mode === 'advanced'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          高级
        </button>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {onRestart && (
          <button
            onClick={onRestart}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted'
            )}
            title="重新开始"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted'
            )}
            title="退出学习"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
