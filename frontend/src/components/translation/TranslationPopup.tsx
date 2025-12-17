'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, BookmarkPlus, Volume2, Loader2, Copy, Check } from 'lucide-react';
import type { TranslateResponse } from '@/types/api';

interface TranslationPopupProps {
  text: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToVocabulary?: (word: string, translation: string) => void;
}

export function TranslationPopup({
  text,
  position,
  onClose,
  onAddToVocabulary,
}: TranslationPopupProps) {
  const [translation, setTranslation] = useState<TranslateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  // 获取翻译
  const fetchTranslation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target_language: 'zh',
          use_cache: true,
        }),
      });

      if (!response.ok) {
        throw new Error('翻译请求失败');
      }

      const data: TranslateResponse = await response.json();
      setTranslation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻译失败');
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  useEffect(() => {
    fetchTranslation();
  }, [fetchTranslation]);

  // 复制翻译结果
  const handleCopy = async () => {
    if (!translation) return;

    try {
      await navigator.clipboard.writeText(translation.translated_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 添加到生词本
  const handleAddToVocabulary = () => {
    if (!translation || !onAddToVocabulary) return;

    onAddToVocabulary(text, translation.translated_text);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // 计算弹窗位置，确保不超出视口
  const getPopupStyle = () => {
    const popupWidth = 320;
    const popupHeight = 200;
    const padding = 16;

    let left = position.x - popupWidth / 2;
    let top = position.y - popupHeight - 12; // 显示在选中文本上方

    // 确保不超出左边界
    if (left < padding) {
      left = padding;
    }

    // 确保不超出右边界
    if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding;
    }

    // 如果上方空间不足，显示在下方
    if (top < padding) {
      top = position.y + 24;
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  return (
    <div
      data-translation-popup
      className={cn(
        'fixed z-50 w-80 rounded-lg shadow-lg',
        'bg-popover text-popover-foreground border border-border',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
      style={getPopupStyle()}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium truncate max-w-[200px]">{text}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 内容 */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchTranslation}
              className="mt-2 text-sm text-primary hover:underline"
            >
              重试
            </button>
          </div>
        ) : translation ? (
          <div className="space-y-3">
            {/* 翻译结果 */}
            <div>
              <p className="text-lg">{translation.translated_text}</p>
              {translation.confidence_score < 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  置信度: {Math.round(translation.confidence_score * 100)}%
                </p>
              )}
            </div>

            {/* 来源信息 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                来源: {translation.translation_service === 'local_dict' ? '本地词典' : translation.translation_service}
              </span>
              {translation.from_cache && <span>• 缓存</span>}
            </div>
          </div>
        ) : null}
      </div>

      {/* 操作按钮 */}
      {translation && !isLoading && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border">
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm',
              'hover:bg-accent transition-colors',
              copied && 'text-green-600'
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? '已复制' : '复制'}
          </button>

          {onAddToVocabulary && (
            <button
              onClick={handleAddToVocabulary}
              disabled={added}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm',
                'hover:bg-accent transition-colors',
                added && 'text-green-600'
              )}
            >
              {added ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              {added ? '已添加' : '加入生词本'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
