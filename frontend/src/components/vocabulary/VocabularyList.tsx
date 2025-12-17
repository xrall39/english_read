'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { VocabularyCard } from './VocabularyCard';
import { Loader2, BookMarked, RefreshCw, Search, Filter } from 'lucide-react';
import type { VocabularyItem } from '@/types/api';

interface VocabularyListProps {
  onWordClick?: (word: string) => void;
}

type FilterType = 'all' | 'unmastered' | 'learning' | 'mastered';

export function VocabularyList({ onWordClick }: VocabularyListProps) {
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchVocabulary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '/api/vocabulary?user_id=1&limit=100';

      if (searchKeyword) {
        url += `&keyword=${encodeURIComponent(searchKeyword)}`;
      } else if (filter !== 'all') {
        const masteryLevel = filter === 'unmastered' ? 1 : filter === 'learning' ? 3 : 5;
        url += `&mastery_level=${masteryLevel}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('获取生词本失败');
      }
      const data = await response.json();
      setVocabularyList(data.vocabulary || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [searchKeyword, filter]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const handleDelete = async (vocabId: number) => {
    if (!confirm('确定要删除这个生词吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/vocabulary?user_id=1&vocab_id=${vocabId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVocabularyList((prev) => prev.filter((v) => v.id !== vocabId));
      } else {
        throw new Error('删除失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleUpdateMastery = async (vocabId: number, masteryLevel: number) => {
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocab_id: vocabId,
          mastery_level: masteryLevel,
          correct: true,
        }),
      });

      if (response.ok) {
        setVocabularyList((prev) =>
          prev.map((v) =>
            v.id === vocabId
              ? { ...v, mastery_level: masteryLevel, review_count: v.review_count + 1 }
              : v
          )
        );
      } else {
        throw new Error('更新失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVocabulary();
  };

  const filteredList = vocabularyList.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'unmastered') return v.mastery_level <= 1;
    if (filter === 'learning') return v.mastery_level >= 2 && v.mastery_level <= 3;
    if (filter === 'mastered') return v.mastery_level >= 4;
    return true;
  });

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
          onClick={fetchVocabulary}
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

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索单词或翻译..."
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg',
                'border border-input bg-background',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'placeholder:text-muted-foreground'
              )}
            />
          </div>
        </form>

        {/* 筛选按钮 */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['all', 'unmastered', 'learning', 'mastered'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {f === 'all' && '全部'}
              {f === 'unmastered' && '未掌握'}
              {f === 'learning' && '学习中'}
              {f === 'mastered' && '已掌握'}
            </button>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {filteredList.length} 个单词</span>
        <button
          onClick={fetchVocabulary}
          className={cn(
            'p-2 rounded-lg',
            'hover:bg-accent transition-colors'
          )}
          title="刷新"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* 列表 */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchKeyword ? '未找到匹配的单词' : '生词本为空'}
          </h3>
          <p className="text-muted-foreground">
            {searchKeyword
              ? '尝试其他关键词'
              : '阅读文章时，选中单词并点击"加入生词本"'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((vocabulary) => (
            <VocabularyCard
              key={vocabulary.id}
              vocabulary={vocabulary}
              onDelete={handleDelete}
              onUpdateMastery={handleUpdateMastery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
