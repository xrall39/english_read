/**
 * 学习统计页面
 * 展示学习数据和进度
 */

'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Flame,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { LearningStatsSummary } from '@/types/api';

export default function StatsPage() {
  const [stats, setStats] = useState<LearningStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // 加载统计数据
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stats?period=${period}`);
        if (!response.ok) {
          throw new Error('加载统计数据失败');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [period]);

  // 计算掌握程度总数
  const getTotalWords = () => {
    if (!stats?.mastery_distribution) return 0;
    return Object.values(stats.mastery_distribution).reduce((a, b) => a + b, 0);
  };

  // 获取掌握程度百分比
  const getMasteryPercentage = (level: string) => {
    if (!stats?.mastery_distribution) return 0;
    const total = getTotalWords();
    if (total === 0) return 0;
    return ((stats.mastery_distribution[level] || 0) / total) * 100;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">学习统计</h1>
              <p className="text-sm text-muted-foreground">查看你的学习进度</p>
            </div>
          </div>

          {/* 周期切换 */}
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                period === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              本周
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                period === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              本月
            </button>
          </div>
        </div>

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
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {/* 统计内容 */}
        {stats && !isLoading && !error && (
          <div className="space-y-8">
            {/* 今日概览 */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">今日概览</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label="学习单词"
                  value={stats.today.words_learned}
                  color="blue"
                />
                <StatCard
                  icon={<CheckCircle className="h-5 w-5" />}
                  label="复习单词"
                  value={stats.today.vocabulary_reviewed}
                  color="green"
                />
                <StatCard
                  icon={<Target className="h-5 w-5" />}
                  label="准确率"
                  value={`${stats.today.accuracy_rate.toFixed(0)}%`}
                  color="purple"
                />
                <StatCard
                  icon={<Clock className="h-5 w-5" />}
                  label="学习时间"
                  value={formatTime(stats.today.reading_time)}
                  color="orange"
                />
              </div>
            </section>

            {/* 连续学习和待复习 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-xl bg-card border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {stats.streak_days}
                    </div>
                    <div className="text-sm text-muted-foreground">连续学习天数</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.streak_days > 0
                    ? '太棒了！继续保持！'
                    : '今天开始学习吧！'}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {stats.due_for_review}
                    </div>
                    <div className="text-sm text-muted-foreground">待复习单词</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.due_for_review > 0
                    ? '有单词需要复习了'
                    : '暂无待复习单词'}
                </p>
              </div>
            </section>

            {/* 掌握程度分布 */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">掌握程度分布</h2>
              <div className="p-6 rounded-xl bg-card border">
                <div className="space-y-4">
                  {[
                    { level: '5', label: '精通', color: 'bg-emerald-500' },
                    { level: '4', label: '掌握', color: 'bg-green-500' },
                    { level: '3', label: '熟悉', color: 'bg-yellow-500' },
                    { level: '2', label: '学习中', color: 'bg-orange-500' },
                    { level: '1', label: '初学', color: 'bg-red-400' },
                    { level: '0', label: '未学习', color: 'bg-gray-400' },
                  ].map(({ level, label, color }) => (
                    <div key={level} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-muted-foreground">{label}</div>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full transition-all duration-500', color)}
                          style={{ width: `${getMasteryPercentage(level)}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-right text-muted-foreground">
                        {stats.mastery_distribution[level] || 0} 词
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
                  总计 {getTotalWords()} 个单词
                </div>
              </div>
            </section>

            {/* 学习趋势 */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                学习趋势（{period === 'week' ? '近7天' : '近30天'}）
              </h2>
              <div className="p-6 rounded-xl bg-card border">
                <div className="h-48 flex items-end justify-between gap-2">
                  {stats.weekly_trend.slice(-7).map((day, index) => {
                    const maxValue = Math.max(
                      ...stats.weekly_trend.map((d) => d.vocabulary_reviewed)
                    );
                    const height = maxValue > 0
                      ? (day.vocabulary_reviewed / maxValue) * 100
                      : 0;

                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div
                          className="w-full bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.vocabulary_reviewed} 词`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-center gap-6 text-sm text-muted-foreground">
                  <span>
                    平均每日复习:{' '}
                    {(
                      stats.weekly_trend.reduce((a, b) => a + b.vocabulary_reviewed, 0) /
                      stats.weekly_trend.length
                    ).toFixed(0)}{' '}
                    词
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="p-4 rounded-xl bg-card border">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
          colorClasses[color]
        )}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}小时${remainingMinutes}分`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
