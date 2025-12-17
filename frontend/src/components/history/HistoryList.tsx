'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { HistoryCard } from './HistoryCard';
import { Loader2, History, RefreshCw } from 'lucide-react';
import type { ReadingHistory } from '@/types/api';

interface HistoryListProps {
  onContinueReading?: (articleId: number) => void;
}

export function HistoryList({ onContinueReading }: HistoryListProps) {
  const [historyList, setHistoryList] = useState<ReadingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/history?user_id=1&limit=50');
      if (!response.ok) {
        throw new Error('获取阅读历史失败');
      }
      const data = await response.json();
      setHistoryList(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (articleId: number) => {
    if (!confirm('确定要删除这条阅读记录吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/history?user_id=1&article_id=${articleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistoryList((prev) => prev.filter((h) => h.article_id !== articleId));
      } else {
        throw new Error('删除失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={fetchHistory}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          重试
        </button>
      </div>
    );
  }

  if (historyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">暂无阅读记录</h3>
        <p className="text-muted-foreground">
          开始阅读文章后，您的阅读历史将显示在这里
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          阅读历史 ({historyList.length})
        </h2>
        <button
          onClick={fetchHistory}
          className={cn(
            'p-2 rounded-lg text-muted-foreground',
            'hover:bg-accent transition-colors'
          )}
          title="刷新"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* 列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {historyList.map((history) => (
          <HistoryCard
            key={`${history.user_id}-${history.article_id}`}
            history={history}
            onContinueReading={onContinueReading}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
