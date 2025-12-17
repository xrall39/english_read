'use client';

import { cn } from '@/lib/utils';
import { Clock, BookOpen, BarChart2, Tag } from 'lucide-react';
import type { ArticleResponse } from '@/types/api';

interface ArticleInfoProps {
  article: ArticleResponse;
  className?: string;
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  very_easy: { label: '非常简单', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  easy: { label: '简单', color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  fairly_easy: { label: '较简单', color: 'text-lime-600 bg-lime-100 dark:bg-lime-900/30' },
  standard: { label: '标准', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  fairly_difficult: { label: '较难', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  difficult: { label: '困难', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  very_difficult: { label: '非常困难', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  unknown: { label: '未知', color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30' },
};

export function ArticleInfo({ article, className }: ArticleInfoProps) {
  const difficulty = difficultyLabels[article.difficulty_level || 'unknown'];
  const estimatedReadTime = article.word_count
    ? Math.ceil(article.word_count / 200) // 假设每分钟阅读200词
    : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 标题和作者 */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
        {article.author && (
          <p className="text-sm text-muted-foreground">作者: {article.author}</p>
        )}
      </div>

      {/* 统计信息 */}
      <div className="flex flex-wrap gap-4 text-sm">
        {article.word_count && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{article.word_count} 词</span>
          </div>
        )}
        {estimatedReadTime && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>约 {estimatedReadTime} 分钟</span>
          </div>
        )}
        {article.difficulty_level && (
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                difficulty.color
              )}
            >
              {difficulty.label}
            </span>
          </div>
        )}
      </div>

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {article.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
