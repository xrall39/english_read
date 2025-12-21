/**
 * 学习统计 API 路由
 * 提供学习数据统计和分析功能
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LearningStatsSummary } from '@/types/api';

// 模拟用户 ID
const DEFAULT_USER_ID = 1;

// 模拟统计数据
const mockStats: Record<number, LearningStatsSummary> = {
  1: {
    today: {
      words_learned: 5,
      vocabulary_reviewed: 15,
      accuracy_rate: 80,
      reading_time: 1800, // 30分钟
    },
    mastery_distribution: {
      '0': 10,
      '1': 15,
      '2': 20,
      '3': 12,
      '4': 8,
      '5': 5,
    },
    weekly_trend: [
      { date: '2025-12-15', words_learned: 8, vocabulary_reviewed: 20, accuracy_rate: 75 },
      { date: '2025-12-16', words_learned: 5, vocabulary_reviewed: 18, accuracy_rate: 78 },
      { date: '2025-12-17', words_learned: 10, vocabulary_reviewed: 25, accuracy_rate: 82 },
      { date: '2025-12-18', words_learned: 3, vocabulary_reviewed: 12, accuracy_rate: 85 },
      { date: '2025-12-19', words_learned: 7, vocabulary_reviewed: 22, accuracy_rate: 79 },
      { date: '2025-12-20', words_learned: 6, vocabulary_reviewed: 19, accuracy_rate: 81 },
      { date: '2025-12-21', words_learned: 5, vocabulary_reviewed: 15, accuracy_rate: 80 },
    ],
    due_for_review: 12,
    streak_days: 7,
    total_words: 70,
  },
};

/**
 * GET /api/stats
 * 获取学习统计数据
 *
 * Query params:
 * - user_id: 用户ID
 * - period: 'day' | 'week' | 'month' - 统计周期
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('user_id') || String(DEFAULT_USER_ID));
    const period = searchParams.get('period') || 'week';

    // 获取用户统计数据
    const stats = mockStats[userId] || {
      today: {
        words_learned: 0,
        vocabulary_reviewed: 0,
        accuracy_rate: 0,
        reading_time: 0,
      },
      mastery_distribution: {},
      weekly_trend: [],
      due_for_review: 0,
      streak_days: 0,
      total_words: 0,
    };

    // 根据周期过滤趋势数据
    let trend = stats.weekly_trend;
    if (period === 'day') {
      trend = trend.slice(-1);
    } else if (period === 'month') {
      // 模拟30天数据
      trend = generateMonthlyTrend();
    }

    return NextResponse.json({
      ...stats,
      weekly_trend: trend,
      period,
      user_id: userId,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stats
 * 更新学习统计
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id = DEFAULT_USER_ID,
      words_learned = 0,
      vocabulary_reviewed = 0,
      correct_count = 0,
      total_count = 0,
    } = body;

    // 计算准确率
    const accuracy_rate = total_count > 0 ? (correct_count / total_count) * 100 : 0;

    // 更新统计数据（实际应用中应更新数据库）
    if (!mockStats[user_id]) {
      mockStats[user_id] = {
        today: {
          words_learned: 0,
          vocabulary_reviewed: 0,
          accuracy_rate: 0,
          reading_time: 0,
        },
        mastery_distribution: {},
        weekly_trend: [],
        due_for_review: 0,
        streak_days: 0,
        total_words: 0,
      };
    }

    mockStats[user_id].today.words_learned += words_learned;
    mockStats[user_id].today.vocabulary_reviewed += vocabulary_reviewed;

    // 更新准确率（加权平均）
    const oldTotal = mockStats[user_id].today.vocabulary_reviewed - vocabulary_reviewed;
    const newTotal = mockStats[user_id].today.vocabulary_reviewed;
    if (newTotal > 0) {
      mockStats[user_id].today.accuracy_rate =
        (mockStats[user_id].today.accuracy_rate * oldTotal + accuracy_rate * vocabulary_reviewed) / newTotal;
    }

    return NextResponse.json({
      success: true,
      updated_stats: mockStats[user_id].today,
    });
  } catch (error) {
    console.error('更新统计数据失败:', error);
    return NextResponse.json(
      { error: '更新统计数据失败' },
      { status: 500 }
    );
  }
}

/**
 * 生成模拟的月度趋势数据
 */
function generateMonthlyTrend() {
  const trend = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // 生成随机但合理的数据
    const wordsLearned = Math.floor(Math.random() * 10) + 2;
    const vocabularyReviewed = Math.floor(Math.random() * 20) + 10;
    const accuracyRate = Math.floor(Math.random() * 20) + 70;

    trend.push({
      date: dateStr,
      words_learned: wordsLearned,
      vocabulary_reviewed: vocabularyReviewed,
      accuracy_rate: accuracyRate,
    });
  }

  return trend;
}
