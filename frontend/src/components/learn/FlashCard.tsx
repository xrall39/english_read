/**
 * FlashCard 组件
 * 单词卡片，支持翻转动画、语音朗读和评分
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, RotateCcw } from 'lucide-react';
import type { VocabularyItem, ResponseQuality, LearningMode } from '@/types/api';

interface FlashCardProps {
  /** 单词数据 */
  vocabulary: VocabularyItem;
  /** 评分回调 */
  onResponse: (quality: ResponseQuality) => void;
  /** 学习模式 */
  mode: LearningMode;
  /** 是否显示答案 */
  showAnswer?: boolean;
  /** 翻转回调 */
  onFlip?: () => void;
}

export function FlashCard({
  vocabulary,
  onResponse,
  mode,
  showAnswer = false,
  onFlip,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(showAnswer);

  // 同步外部状态
  useEffect(() => {
    setIsFlipped(showAnswer);
  }, [showAnswer]);

  // 翻转卡片
  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  }, [isFlipped, onFlip]);

  // 语音朗读
  const handleSpeak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      // 取消之前的朗读
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(vocabulary.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [vocabulary.word]);

  // 处理评分
  const handleResponse = useCallback((quality: ResponseQuality) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onResponse(quality);
  }, [onResponse]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 空格键翻转
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
        return;
      }

      // 只有翻转后才能评分
      if (!isFlipped) return;

      if (mode === 'simple') {
        // 简单模式：1/n = 不认识，2/y = 认识
        if (e.key === '1' || e.key.toLowerCase() === 'n') {
          onResponse(1);
        } else if (e.key === '2' || e.key.toLowerCase() === 'y') {
          onResponse(4);
        }
      } else {
        // 高级模式：0-5 评分
        const num = parseInt(e.key);
        if (num >= 0 && num <= 5) {
          onResponse(num as ResponseQuality);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, mode, onResponse, handleFlip]);

  return (
    <div className="perspective-1000 w-full max-w-lg mx-auto">
      <div
        className={cn(
          'relative w-full h-80 cursor-pointer transition-transform duration-500',
          'transform-style-preserve-3d',
          isFlipped && 'rotate-y-180'
        )}
        onClick={handleFlip}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 正面 - 单词 */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl border bg-card shadow-lg p-6',
            'flex flex-col items-center justify-center',
            'backface-hidden'
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            {vocabulary.word}
          </h2>

          {vocabulary.pronunciation && (
            <p className="text-lg text-muted-foreground mb-4">
              {vocabulary.pronunciation}
            </p>
          )}

          <button
            onClick={handleSpeak}
            className={cn(
              'p-3 rounded-full transition-colors',
              'bg-primary/10 hover:bg-primary/20',
              'text-primary'
            )}
            title="朗读单词"
          >
            <Volume2 className="h-6 w-6" />
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            点击卡片或按空格键查看答案
          </p>
        </div>

        {/* 背面 - 翻译和例句 */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl border bg-card shadow-lg p-6',
            'flex flex-col',
            'backface-hidden'
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* 翻译 */}
            <p className="text-2xl font-medium mb-4 text-foreground text-center">
              {vocabulary.translation || vocabulary.definition}
            </p>

            {/* 词性 */}
            {vocabulary.word_type && (
              <span className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground mb-4">
                {vocabulary.word_type}
              </span>
            )}

            {/* 例句 */}
            {vocabulary.example_sentence && (
              <p className="text-muted-foreground italic text-center text-sm">
                &ldquo;{vocabulary.example_sentence}&rdquo;
              </p>
            )}
          </div>

          {/* 评分按钮 */}
          <div className="mt-4 flex justify-center gap-3">
            {mode === 'simple' ? (
              // 简单模式
              <>
                <button
                  onClick={handleResponse(1)}
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium transition-colors',
                    'bg-red-500 text-white hover:bg-red-600'
                  )}
                >
                  不认识 (1)
                </button>
                <button
                  onClick={handleResponse(4)}
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium transition-colors',
                    'bg-green-500 text-white hover:bg-green-600'
                  )}
                >
                  认识 (2)
                </button>
              </>
            ) : (
              // 高级模式
              [0, 1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  onClick={handleResponse(q as ResponseQuality)}
                  className={cn(
                    'w-10 h-10 rounded-lg font-medium transition-colors',
                    q < 3
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                      : q < 4
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  )}
                  title={getQualityLabel(q as ResponseQuality)}
                >
                  {q}
                </button>
              ))
            )}
          </div>

          {/* 快捷键提示 */}
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {mode === 'simple'
              ? '快捷键：1/N = 不认识，2/Y = 认识'
              : '快捷键：0-5 评分'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 获取评分标签
 */
function getQualityLabel(quality: ResponseQuality): string {
  const labels: Record<ResponseQuality, string> = {
    0: '完全不认识',
    1: '错误，看到答案后想起来了',
    2: '错误，答案感觉熟悉',
    3: '正确，但很费力',
    4: '正确，有些犹豫',
    5: '正确，非常轻松',
  };
  return labels[quality];
}
