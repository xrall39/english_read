/**
 * LearningProgress 组件
 * 显示学习进度
 */

'use client';

import { cn } from '@/lib/utils';

interface LearningProgressProps {
  /** 当前索引 */
  current: number;
  /** 总数 */
  total: number;
  /** 正确数 */
  correct: number;
  /** 错误数 */
  incorrect: number;
  /** 额外的类名 */
  className?: string;
}

export function LearningProgress({
  current,
  total,
  correct,
  incorrect,
  className,
}: LearningProgressProps) {
  const progress = total > 0 ? ((current) / total) * 100 : 0;
  const accuracy = (correct + incorrect) > 0
    ? (correct / (correct + incorrect)) * 100
    : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* 进度条 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground min-w-[60px] text-right">
          {current} / {total}
        </span>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">正确: {correct}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">错误: {incorrect}</span>
        </div>
        {(correct + incorrect) > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              准确率: {accuracy.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
