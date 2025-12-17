'use client';

import { MainLayout } from '@/components/layout';
import { VocabularyList } from '@/components/vocabulary';
import { BookMarked } from 'lucide-react';

export default function VocabularyPage() {
  return (
    <MainLayout maxWidth="4xl">
      <div className="py-8">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-8">
          <BookMarked className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">生词本</h1>
            <p className="text-muted-foreground">
              管理您收藏的单词，跟踪学习进度
            </p>
          </div>
        </div>

        {/* 生词列表 */}
        <VocabularyList />
      </div>
    </MainLayout>
  );
}
