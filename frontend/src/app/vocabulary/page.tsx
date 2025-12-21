'use client';

import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { VocabularyList } from '@/components/vocabulary';
import { BookMarked, GraduationCap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VocabularyPage() {
  return (
    <MainLayout maxWidth="4xl">
      <div className="py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookMarked className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">生词本</h1>
              <p className="text-muted-foreground">
                管理您收藏的单词，跟踪学习进度
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <Link
              href="/stats"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'text-sm font-medium transition-colors',
                'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">学习统计</span>
            </Link>
            <Link
              href="/learn"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'text-sm font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              <GraduationCap className="h-4 w-4" />
              <span>开始学习</span>
            </Link>
          </div>
        </div>

        {/* 生词列表 */}
        <VocabularyList />
      </div>
    </MainLayout>
  );
}
