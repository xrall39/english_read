/**
 * 学习模式 API 路由
 * 提供间隔重复学习系统的核心功能
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateNextReview,
  type VocabularyReviewState,
} from '@/lib/spaced-repetition';
import type {
  VocabularyItem,
  RecordLearningRequest,
  RecordLearningResponse,
  ResponseQuality,
  SessionType,
} from '@/types/api';

// 模拟用户 ID（实际应用中应从认证系统获取）
const DEFAULT_USER_ID = 1;

// 模拟生词数据（实际应用中应从数据库获取）
let mockVocabulary: VocabularyItem[] = [
  {
    id: 1,
    user_id: 1,
    word: 'ephemeral',
    translation: '短暂的，转瞬即逝的',
    pronunciation: '/ɪˈfemərəl/',
    definition: 'lasting for a very short time',
    example_sentence: 'Fame is ephemeral in the entertainment industry.',
    word_type: 'adjective',
    difficulty_level: 4,
    mastery_level: 0,
    first_encountered: '2025-12-20T10:00:00Z',
    review_count: 0,
    correct_count: 0,
    ease_factor: 2.5,
    interval_days: 0,
    consecutive_correct: 0,
  },
  {
    id: 2,
    user_id: 1,
    word: 'ubiquitous',
    translation: '无处不在的',
    pronunciation: '/juːˈbɪkwɪtəs/',
    definition: 'present, appearing, or found everywhere',
    example_sentence: 'Smartphones have become ubiquitous in modern society.',
    word_type: 'adjective',
    difficulty_level: 4,
    mastery_level: 1,
    first_encountered: '2025-12-19T10:00:00Z',
    last_reviewed: '2025-12-20T10:00:00Z',
    review_count: 1,
    correct_count: 1,
    ease_factor: 2.5,
    interval_days: 1,
    consecutive_correct: 1,
    next_review: '2025-12-21T00:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    word: 'serendipity',
    translation: '意外发现美好事物的运气',
    pronunciation: '/ˌserənˈdɪpəti/',
    definition: 'the occurrence of events by chance in a happy way',
    example_sentence: 'It was pure serendipity that we met at the conference.',
    word_type: 'noun',
    difficulty_level: 3,
    mastery_level: 2,
    first_encountered: '2025-12-18T10:00:00Z',
    last_reviewed: '2025-12-20T10:00:00Z',
    review_count: 2,
    correct_count: 2,
    ease_factor: 2.6,
    interval_days: 6,
    consecutive_correct: 2,
    next_review: '2025-12-26T00:00:00Z',
  },
  {
    id: 4,
    user_id: 1,
    word: 'pragmatic',
    translation: '务实的，实用主义的',
    pronunciation: '/præɡˈmætɪk/',
    definition: 'dealing with things sensibly and realistically',
    example_sentence: 'We need a pragmatic approach to solve this problem.',
    word_type: 'adjective',
    difficulty_level: 3,
    mastery_level: 0,
    first_encountered: '2025-12-21T08:00:00Z',
    review_count: 0,
    correct_count: 0,
    ease_factor: 2.5,
    interval_days: 0,
    consecutive_correct: 0,
  },
  {
    id: 5,
    user_id: 1,
    word: 'eloquent',
    translation: '雄辩的，有说服力的',
    pronunciation: '/ˈeləkwənt/',
    definition: 'fluent or persuasive in speaking or writing',
    example_sentence: 'She gave an eloquent speech at the ceremony.',
    word_type: 'adjective',
    difficulty_level: 2,
    mastery_level: 3,
    first_encountered: '2025-12-15T10:00:00Z',
    last_reviewed: '2025-12-20T10:00:00Z',
    review_count: 4,
    correct_count: 4,
    ease_factor: 2.7,
    interval_days: 15,
    consecutive_correct: 4,
    next_review: '2026-01-04T00:00:00Z',
  },
];

/**
 * GET /api/learn
 * 获取待学习/复习的单词列表
 *
 * Query params:
 * - user_id: 用户ID
 * - mode: 'learn' | 'review' - 学习模式
 * - limit: 返回数量限制
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('user_id') || String(DEFAULT_USER_ID));
    const mode = (searchParams.get('mode') || 'review') as SessionType;
    const limit = parseInt(searchParams.get('limit') || '20');

    // 获取用户的生词
    const userVocabulary = mockVocabulary.filter((v) => v.user_id === userId);

    let words: VocabularyItem[];
    const now = new Date();

    if (mode === 'learn') {
      // 学习模式：获取从未复习过的新单词
      words = userVocabulary
        .filter((v) => v.review_count === 0)
        .slice(0, limit);
    } else {
      // 复习模式：获取需要复习的单词
      words = userVocabulary
        .filter((v) => {
          // 从未复习过的单词
          if (!v.next_review) return true;
          // 已到复习时间的单词
          return new Date(v.next_review) <= now;
        })
        .sort((a, b) => {
          // 优先级排序：未复习 > 已过期 > 掌握程度低
          if (!a.next_review && b.next_review) return -1;
          if (a.next_review && !b.next_review) return 1;
          if (a.next_review && b.next_review) {
            const aDate = new Date(a.next_review);
            const bDate = new Date(b.next_review);
            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;
          }
          return a.mastery_level - b.mastery_level;
        })
        .slice(0, limit);
    }

    return NextResponse.json({
      words,
      total: words.length,
      mode,
      user_id: userId,
    });
  } catch (error) {
    console.error('获取学习单词失败:', error);
    return NextResponse.json(
      { error: '获取学习单词失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learn
 * 记录学习结果
 */
export async function POST(request: NextRequest) {
  try {
    const body: RecordLearningRequest = await request.json();
    const { user_id, vocab_id, quality } = body;

    // 验证参数
    if (!vocab_id || quality === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: '质量评分必须在 0-5 之间' },
        { status: 400 }
      );
    }

    // 查找单词
    const vocabIndex = mockVocabulary.findIndex(
      (v) => v.id === vocab_id && v.user_id === (user_id || DEFAULT_USER_ID)
    );

    if (vocabIndex === -1) {
      return NextResponse.json(
        { error: '未找到该单词' },
        { status: 404 }
      );
    }

    const vocab = mockVocabulary[vocabIndex];

    // 构建当前复习状态
    const currentState: VocabularyReviewState = {
      intervalDays: vocab.interval_days || 0,
      easeFactor: vocab.ease_factor || 2.5,
      consecutiveCorrect: vocab.consecutive_correct || 0,
      masteryLevel: vocab.mastery_level,
    };

    // 计算下次复习时间
    const result = calculateNextReview(quality as ResponseQuality, currentState);

    // 更新单词数据
    mockVocabulary[vocabIndex] = {
      ...vocab,
      next_review: result.nextReview.toISOString(),
      ease_factor: result.newEaseFactor,
      interval_days: result.newInterval,
      mastery_level: result.newMasteryLevel,
      consecutive_correct: result.consecutiveCorrect,
      last_reviewed: new Date().toISOString(),
      review_count: vocab.review_count + 1,
      correct_count: vocab.correct_count + (result.isCorrect ? 1 : 0),
    };

    const response: RecordLearningResponse = {
      success: true,
      vocab_id,
      next_review: result.nextReview.toISOString(),
      new_mastery_level: result.newMasteryLevel,
      new_interval_days: result.newInterval,
      is_correct: result.isCorrect,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('记录学习结果失败:', error);
    return NextResponse.json(
      { error: '记录学习结果失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/learn
 * 创建或结束学习会话
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      // 创建新会话
      const { user_id, session_type } = body;
      const session = {
        id: Date.now(),
        user_id: user_id || DEFAULT_USER_ID,
        session_type: session_type || 'review',
        started_at: new Date().toISOString(),
        words_studied: 0,
        words_correct: 0,
        words_incorrect: 0,
        duration_seconds: 0,
      };

      return NextResponse.json({
        success: true,
        session,
      });
    } else if (action === 'end') {
      // 结束会话
      const { session_id, words_studied, words_correct, words_incorrect, duration_seconds } = body;

      return NextResponse.json({
        success: true,
        session_id,
        summary: {
          words_studied,
          words_correct,
          words_incorrect,
          duration_seconds,
          accuracy_rate: words_studied > 0 ? (words_correct / words_studied) * 100 : 0,
        },
      });
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('会话操作失败:', error);
    return NextResponse.json(
      { error: '会话操作失败' },
      { status: 500 }
    );
  }
}
