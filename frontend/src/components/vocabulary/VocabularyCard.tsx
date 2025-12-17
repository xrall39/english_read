'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, Trash2, Star, BookOpen } from 'lucide-react';
import type { VocabularyItem } from '@/types/api';

interface VocabularyCardProps {
  vocabulary: VocabularyItem;
  onDelete?: (vocabId: number) => void;
  onUpdateMastery?: (vocabId: number, masteryLevel: number) => void;
}

export function VocabularyCard({ vocabulary, onDelete, onUpdateMastery }: VocabularyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getMasteryColor = (level: number) => {
    if (level >= 4) return 'text-green-500';
    if (level >= 2) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 4) return '已掌握';
    if (level >= 2) return '学习中';
    return '未掌握';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocabulary.word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete?.(vocabulary.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-card overflow-hidden',
        'hover:shadow-md transition-all duration-200',
        'hover:border-primary/30'
      )}
    >
      {/* 主要内容 */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 单词和发音 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {vocabulary.word}
            </h3>
            {vocabulary.pronunciation && (
              <p className="text-sm text-muted-foreground">
                {vocabulary.pronunciation}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSpeak();
            }}
            className={cn(
              'p-2 rounded-full text-muted-foreground',
              'hover:bg-accent hover:text-foreground transition-colors'
            )}
            title="朗读"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        {/* 翻译 */}
        <p className="text-foreground mb-3">
          {vocabulary.translation || vocabulary.definition || '暂无翻译'}
        </p>

        {/* 掌握程度 */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateMastery?.(vocabulary.id, level);
              }}
              className={cn(
                'p-0.5 transition-colors',
                level <= vocabulary.mastery_level
                  ? getMasteryColor(vocabulary.mastery_level)
                  : 'text-gray-300 dark:text-gray-600'
              )}
              title={`设置掌握程度为 ${level}`}
            >
              <Star
                className="h-4 w-4"
                fill={level <= vocabulary.mastery_level ? 'currentColor' : 'none'}
              />
            </button>
          ))}
          <span className={cn('ml-2 text-xs', getMasteryColor(vocabulary.mastery_level))}>
            {getMasteryLabel(vocabulary.mastery_level)}
          </span>
        </div>
      </div>

      {/* 展开的详细信息 */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border mt-2 pt-3 space-y-3">
          {/* 词性 */}
          {vocabulary.word_type && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">词性:</span>
              <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                {vocabulary.word_type}
              </span>
            </div>
          )}

          {/* 例句 */}
          {vocabulary.example_sentence && (
            <div className="text-sm">
              <span className="text-muted-foreground">例句:</span>
              <p className="mt-1 text-foreground italic">
                &ldquo;{vocabulary.example_sentence}&rdquo;
              </p>
            </div>
          )}

          {/* 上下文 */}
          {vocabulary.context && (
            <div className="text-sm">
              <span className="text-muted-foreground">上下文:</span>
              <p className="mt-1 text-foreground">
                {vocabulary.context}
              </p>
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>添加于: {formatDate(vocabulary.first_encountered)}</span>
            <span>复习: {vocabulary.review_count}次</span>
            <span>正确率: {vocabulary.review_count > 0
              ? Math.round((vocabulary.correct_count / vocabulary.review_count) * 100)
              : 0}%</span>
          </div>

          {/* 来源文章 */}
          {vocabulary.source_article_id && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                来自文章 #{vocabulary.source_article_id}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 删除按钮 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={cn(
            'p-1.5 rounded-full',
            'bg-background/80 text-muted-foreground',
            'hover:bg-destructive/10 hover:text-destructive transition-colors',
            'disabled:opacity-50'
          )}
          title="删除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
