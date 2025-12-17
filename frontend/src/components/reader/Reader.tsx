'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArticleContent } from './ArticleContent';
import { ArticleInfo } from './ArticleInfo';
import { ReaderToolbar } from './ReaderToolbar';
import { ReadingProgress } from './ReadingProgress';
import type { ArticleResponse } from '@/types/api';

interface ReaderProps {
  article: ArticleResponse;
  className?: string;
  onTextSelect?: (selectedText: string, position: { x: number; y: number }) => void;
}

export function Reader({ article, className, onTextSelect }: ReaderProps) {
  const [fontSize, setFontSize] = useState(18);
  const [isImmersive, setIsImmersive] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // 计算阅读进度
  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.min(100, (scrollTop / docHeight) * 100);
  }, []);

  // 监听滚动更新进度
  useEffect(() => {
    const handleScroll = () => {
      setReadingProgress(calculateProgress());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始化

    return () => window.removeEventListener('scroll', handleScroll);
  }, [calculateProgress]);

  // 从localStorage恢复设置
  useEffect(() => {
    const savedFontSize = localStorage.getItem('reader-font-size');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }
  }, []);

  // 保存字体大小设置
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('reader-font-size', size.toString());
  };

  // 切换沉浸模式
  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
  };

  // ESC退出沉浸模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersive) {
        setIsImmersive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImmersive]);

  return (
    <div
      className={cn(
        'relative',
        isImmersive && 'fixed inset-0 z-50 bg-background overflow-auto',
        className
      )}
    >
      {/* 固定在顶部的进度条 */}
      <div
        className={cn(
          'sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border',
          isImmersive ? 'px-4 py-2' : 'px-0 py-2'
        )}
      >
        <div className={cn('mx-auto', isImmersive ? 'max-w-3xl' : 'max-w-none')}>
          <div className="flex items-center justify-between gap-4">
            <ReadingProgress progress={readingProgress} className="flex-1" />
            <ReaderToolbar
              fontSize={fontSize}
              onFontSizeChange={handleFontSizeChange}
              isImmersive={isImmersive}
              onImmersiveToggle={toggleImmersive}
            />
          </div>
        </div>
      </div>

      {/* 文章内容区域 */}
      <div
        className={cn(
          'py-6',
          isImmersive ? 'px-4 max-w-3xl mx-auto' : 'px-0'
        )}
      >
        {/* 文章信息 */}
        <ArticleInfo article={article} className="mb-8" />

        {/* 分隔线 */}
        <hr className="border-border mb-8" />

        {/* 文章正文 */}
        <ArticleContent
          content={article.content}
          fontSize={fontSize}
          onTextSelect={onTextSelect}
        />
      </div>
    </div>
  );
}
