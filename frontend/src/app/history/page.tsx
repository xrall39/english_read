'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { HistoryList } from '@/components/history';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();

  const handleContinueReading = (articleId: number) => {
    // 跳转到阅读器页面，带上文章ID
    router.push(`/reader?article_id=${articleId}`);
  };

  return (
    <MainLayout maxWidth="4xl">
      <div className="py-8">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-8">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">阅读历史</h1>
            <p className="text-muted-foreground">
              查看您的阅读记录，继续未完成的文章
            </p>
          </div>
        </div>

        {/* 历史列表 */}
        <HistoryList onContinueReading={handleContinueReading} />
      </div>
    </MainLayout>
  );
}
