'use client';

import { MainLayout } from '@/components/layout';
import { BookOpen, Languages, BookMarked, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            英语阅读助手
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            通过智能翻译和生词管理，让英语阅读变得更轻松、更高效
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
          <FeatureCard
            icon={<BookOpen className="h-8 w-8" />}
            title="智能阅读器"
            description="支持文章导入，自动分析难度等级"
            href="/reader"
          />
          <FeatureCard
            icon={<Languages className="h-8 w-8" />}
            title="即时翻译"
            description="选中文本即可翻译，支持上下文理解"
            href="/reader"
          />
          <FeatureCard
            icon={<BookMarked className="h-8 w-8" />}
            title="生词本"
            description="收藏生词，智能复习，提高词汇量"
            href="/vocabulary"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="学习统计"
            description="追踪阅读进度，可视化学习成果"
            href="/history"
          />
        </div>

        {/* Quick Start */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">开始阅读</h2>
          <p className="text-muted-foreground mb-6">
            导入一篇英语文章，开始你的阅读之旅
          </p>
          <a
            href="/reader"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium transition-colors hover:bg-primary/90"
          >
            <BookOpen className="h-5 w-5" />
            进入阅读器
          </a>
        </div>
      </div>
    </MainLayout>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col items-center p-6 rounded-xl border border-border bg-card text-card-foreground transition-all hover:shadow-lg hover:border-primary/50"
    >
      <div className="mb-4 text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center">{description}</p>
    </a>
  );
}
