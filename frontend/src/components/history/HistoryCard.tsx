'use client';

import { cn } from '@/lib/utils';
import { BookOpen, Clock, Eye, Trash2, ChevronRight } from 'lucide-react';
import type { ReadingHistory } from '@/types/api';

interface HistoryCardProps {
  history: ReadingHistory;
  onContinueReading?: (articleId: number) => void;
  onDelete?: (articleId: number) => void;
}

export function HistoryCard({ history, onContinueReading, onDelete }: HistoryCardProps) {
  const progressPercent = Math.round(history.reading_progress * 100);
  const readingMinutes = Math.round(history.reading_time / 60);

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'very_easy':
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'fairly_easy':
      case 'standard':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'fairly_difficult':
      case 'difficult':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'very_difficult':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getDifficultyLabel = (level?: string) => {
    const labels: Record<string, string> = {
      very_easy: '非常简单',
      easy: '简单',
      fairly_easy: '较简单',
      standard: '标准',
      fairly_difficult: '较难',
      difficult: '困难',
      very_difficult: '非常困难',
    };
    return labels[level || ''] || '未知';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-card p-4',
        'hover:shadow-md transition-all duration-200',
        'hover:border-primary/30'
      )}
    >
      {/* 头部：标题和难度 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-medium text-foreground line-clamp-2 flex-1">
          {history.title || `文章 #${history.article_id}`}
        </h3>
        {history.difficulty_level && (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
              getDifficultyColor(history.difficulty_level)
            )}
          >
            {getDifficultyLabel(history.difficulty_level)}
          </span>
        )}
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>阅读进度</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              history.completed ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{readingMinutes > 0 ? `${readingMinutes}分钟` : '刚开始'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          <span>{history.words_looked_up}个生词</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{formatDate(history.started_at)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onContinueReading?.(history.article_id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          {history.completed ? '重新阅读' : '继续阅读'}
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => onDelete?.(history.article_id)}
          className={cn(
            'p-2 rounded-md text-muted-foreground',
            'hover:bg-destructive/10 hover:text-destructive transition-colors',
            'opacity-0 group-hover:opacity-100'
          )}
          title="删除记录"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* 完成标记 */}
      {history.completed && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            已完成
          </span>
        </div>
      )}
    </div>
  );
}
