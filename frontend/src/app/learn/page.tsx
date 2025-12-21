/**
 * 学习模式页面
 * 基于间隔重复算法的单词学习
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import {
  FlashCard,
  LearningProgress,
  LearningControls,
  LearningComplete,
} from '@/components/learn';
import { cn } from '@/lib/utils';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import type { VocabularyItem, ResponseQuality, LearningMode, SessionType } from '@/types/api';

export default function LearnPage() {
  const router = useRouter();

  // 状态
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<LearningMode>('simple');
  const [sessionType, setSessionType] = useState<SessionType>('review');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // 统计
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime] = useState(Date.now());

  // 加载单词
  const loadWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/learn?mode=${sessionType}&limit=20`);
      if (!response.ok) {
        throw new Error('加载单词失败');
      }

      const data = await response.json();
      setWords(data.words || []);

      if (data.words.length === 0) {
        setError('没有需要学习的单词');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [sessionType]);

  // 初始加载
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // 处理评分
  const handleResponse = useCallback(async (quality: ResponseQuality) => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    // 记录学习结果
    try {
      await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocab_id: currentWord.id,
          quality,
        }),
      });
    } catch (err) {
      console.error('记录学习结果失败:', err);
    }

    // 更新统计
    if (quality >= 3) {
      setCorrect((prev) => prev + 1);
    } else {
      setIncorrect((prev) => prev + 1);
    }

    // 下一个单词
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      // 学习完成
      setIsComplete(true);
    }
  }, [words, currentIndex]);

  // 重新开始
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setCorrect(0);
    setIncorrect(0);
    setIsComplete(false);
    setShowAnswer(false);
    loadWords();
  }, [loadWords]);

  // 退出
  const handleExit = useCallback(() => {
    router.push('/vocabulary');
  }, [router]);

  // 继续学习
  const handleContinue = useCallback(() => {
    handleRestart();
  }, [handleRestart]);

  // 计算学习时长
  const getDuration = () => Math.floor((Date.now() - startTime) / 1000);

  // 当前单词
  const currentWord = words[currentIndex];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">单词学习</h1>
            <p className="text-sm text-muted-foreground">
              {sessionType === 'learn' ? '学习新单词' : '复习单词'}
            </p>
          </div>
        </div>

        {/* 会话类型切换 */}
        {!isComplete && !isLoading && words.length > 0 && (
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setSessionType('review');
                handleRestart();
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                sessionType === 'review'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              复习模式
            </button>
            <button
              onClick={() => {
                setSessionType('learn');
                handleRestart();
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                sessionType === 'learn'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              学习新词
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push('/vocabulary')}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              返回生词本
            </button>
          </div>
        )}

        {/* 学习完成 */}
        {isComplete && (
          <LearningComplete
            wordsStudied={words.length}
            wordsCorrect={correct}
            wordsIncorrect={incorrect}
            durationSeconds={getDuration()}
            onContinue={handleContinue}
            onBack={handleExit}
          />
        )}

        {/* 学习中 */}
        {!isLoading && !error && !isComplete && currentWord && (
          <div className="space-y-6">
            {/* 控制栏 */}
            <LearningControls
              mode={mode}
              onModeChange={setMode}
              onRestart={handleRestart}
              onExit={handleExit}
            />

            {/* 进度 */}
            <LearningProgress
              current={currentIndex + 1}
              total={words.length}
              correct={correct}
              incorrect={incorrect}
            />

            {/* 卡片 */}
            <FlashCard
              vocabulary={currentWord}
              mode={mode}
              showAnswer={showAnswer}
              onFlip={() => setShowAnswer(!showAnswer)}
              onResponse={handleResponse}
            />

            {/* 快捷键提示 */}
            <div className="text-center text-sm text-muted-foreground">
              <p>按 <kbd className="px-1.5 py-0.5 rounded bg-muted">空格</kbd> 翻转卡片</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
