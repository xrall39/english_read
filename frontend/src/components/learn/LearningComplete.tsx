/**
 * LearningComplete 组件
 * 学习完成后的统计摘要
 */

'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface LearningCompleteProps {
  /** 学习的单词数 */
  wordsStudied: number;
  /** 正确数 */
  wordsCorrect: number;
  /** 错误数 */
  wordsIncorrect: number;
  /** 学习时长（秒） */
  durationSeconds: number;
  /** 继续学习回调 */
  onContinue?: () => void;
  /** 返回回调 */
  onBack?: () => void;
  /** 额外的类名 */
  className?: string;
}

export function LearningComplete({
  wordsStudied,
  wordsCorrect,
  wordsIncorrect,
  durationSeconds,
  onContinue,
  onBack,
  className,
}: LearningCompleteProps) {
  const accuracy = wordsStudied > 0 ? (wordsCorrect / wordsStudied) * 100 : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <div className={cn('text-center space-y-6', className)}>
      {/* 完成图标 */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
      </div>

      {/* 标题 */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">学习完成！</h2>
        <p className="text-muted-foreground mt-1">
          太棒了，继续保持！
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="学习单词"
          value={wordsStudied}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="正确"
          value={wordsCorrect}
          color="green"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="错误"
          value={wordsIncorrect}
          color="red"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="用时"
          value={`${minutes}:${seconds.toString().padStart(2, '0')}`}
          color="purple"
        />
      </div>

      {/* 准确率 */}
      <div className="py-4">
        <div className="text-4xl font-bold text-foreground">
          {accuracy.toFixed(0)}%
        </div>
        <div className="text-sm text-muted-foreground">准确率</div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className={cn(
              'px-6 py-2.5 rounded-lg font-medium transition-colors',
              'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            返回
          </button>
        )}
        {onContinue && (
          <button
            onClick={onContinue}
            className={cn(
              'px-6 py-2.5 rounded-lg font-medium transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            继续学习
          </button>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="p-4 rounded-xl bg-card border">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2 mx-auto', colorClasses[color])}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
