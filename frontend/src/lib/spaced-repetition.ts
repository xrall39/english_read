/**
 * 间隔重复算法 - SM-2 变体
 * 基于艾宾浩斯遗忘曲线优化
 *
 * SM-2 算法是 SuperMemo 2 使用的间隔重复算法，
 * 本实现在其基础上进行了优化，更适合英语单词学习场景。
 */

/** 回答质量评分 (0-5) */
export type ResponseQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 回答质量说明：
 * 0: 完全不认识 - 看到答案也想不起来
 * 1: 错误 - 看到答案后想起来了
 * 2: 错误 - 答案感觉熟悉
 * 3: 正确 - 但很费力，需要很长时间回忆
 * 4: 正确 - 有些犹豫，但最终想起来了
 * 5: 正确 - 非常轻松，立即想起来
 */

/** 复习结果 */
export interface ReviewResult {
  /** 下次复习时间 */
  nextReview: Date;
  /** 新的间隔天数 */
  newInterval: number;
  /** 新的难度因子 */
  newEaseFactor: number;
  /** 新的掌握程度 (0-5) */
  newMasteryLevel: number;
  /** 连续正确次数 */
  consecutiveCorrect: number;
  /** 本次是否回答正确 */
  isCorrect: boolean;
}

/** 词汇复习状态 */
export interface VocabularyReviewState {
  /** 当前间隔天数 */
  intervalDays: number;
  /** 难度因子 */
  easeFactor: number;
  /** 连续正确次数 */
  consecutiveCorrect: number;
  /** 掌握程度 */
  masteryLevel: number;
}

/** 最小难度因子 */
const MIN_EASE_FACTOR = 1.3;

/** 默认难度因子 */
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * 计算下次复习时间和相关参数
 *
 * @param quality - 回答质量 (0-5)
 * @param currentState - 当前复习状态
 * @returns 复习结果
 */
export function calculateNextReview(
  quality: ResponseQuality,
  currentState: VocabularyReviewState
): ReviewResult {
  const { intervalDays, easeFactor, consecutiveCorrect } = currentState;

  // 判断是否回答正确 (质量 >= 3 视为正确)
  const isCorrect = quality >= 3;

  // 计算新的难度因子 (SM-2 公式)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  let newInterval: number;
  let newConsecutiveCorrect: number;

  if (!isCorrect) {
    // 回答错误，重置间隔为 1 天
    newInterval = 1;
    newConsecutiveCorrect = 0;
  } else {
    // 回答正确
    newConsecutiveCorrect = consecutiveCorrect + 1;

    if (intervalDays === 0) {
      // 第一次学习
      newInterval = 1;
    } else if (intervalDays === 1) {
      // 第二次复习
      newInterval = 6;
    } else {
      // 后续复习，使用难度因子计算
      newInterval = Math.round(intervalDays * newEaseFactor);
    }

    // 根据回答质量微调间隔
    if (quality === 3) {
      // 勉强正确，稍微缩短间隔
      newInterval = Math.max(1, Math.round(newInterval * 0.8));
    } else if (quality === 5) {
      // 非常轻松，可以稍微延长间隔
      newInterval = Math.round(newInterval * 1.1);
    }
  }

  // 计算掌握程度 (0-5)
  const newMasteryLevel = calculateMasteryLevel(newConsecutiveCorrect, newInterval);

  // 计算下次复习时间
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(0, 0, 0, 0); // 设置为当天开始

  return {
    nextReview,
    newInterval,
    newEaseFactor,
    newMasteryLevel,
    consecutiveCorrect: newConsecutiveCorrect,
    isCorrect,
  };
}

/**
 * 根据连续正确次数和间隔计算掌握程度
 *
 * 掌握程度说明：
 * 0: 未学习 - 从未复习过
 * 1: 初学 - 刚开始学习
 * 2: 学习中 - 有一定记忆
 * 3: 熟悉 - 记忆较稳定
 * 4: 掌握 - 长期记忆形成
 * 5: 精通 - 完全掌握
 */
function calculateMasteryLevel(consecutiveCorrect: number, interval: number): number {
  if (consecutiveCorrect === 0) return 0;
  if (consecutiveCorrect === 1) return 1;
  if (consecutiveCorrect === 2 && interval >= 6) return 2;
  if (consecutiveCorrect >= 3 && interval >= 15) return 3;
  if (consecutiveCorrect >= 4 && interval >= 30) return 4;
  if (consecutiveCorrect >= 5 && interval >= 60) return 5;
  return Math.min(consecutiveCorrect, 3);
}

/**
 * 简单模式：将"认识/不认识"转换为质量评分
 *
 * @param known - 是否认识
 * @returns 质量评分
 */
export function simpleToQuality(known: boolean): ResponseQuality {
  return known ? 4 : 1;
}

/**
 * 获取复习优先级分数（分数越高越需要复习）
 *
 * @param nextReview - 下次复习时间
 * @param masteryLevel - 掌握程度
 * @param lastReviewed - 上次复习时间
 * @returns 优先级分数
 */
export function getReviewPriority(
  nextReview: Date | null,
  masteryLevel: number,
  lastReviewed: Date | null
): number {
  const now = new Date();

  // 从未复习过的单词优先级最高
  if (!nextReview || !lastReviewed) {
    return 1000;
  }

  // 计算过期天数
  const overdueDays = Math.floor(
    (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (overdueDays > 0) {
    // 过期的单词，过期越久优先级越高
    return 500 + overdueDays * 10;
  }

  // 未过期的单词，掌握程度越低优先级越高
  return (5 - masteryLevel) * 10;
}

/**
 * 判断单词是否需要复习
 *
 * @param nextReview - 下次复习时间
 * @returns 是否需要复习
 */
export function isDueForReview(nextReview: Date | string | null): boolean {
  if (!nextReview) return true;

  const reviewDate = typeof nextReview === 'string' ? new Date(nextReview) : nextReview;
  return reviewDate <= new Date();
}

/**
 * 格式化下次复习时间为友好文本
 *
 * @param nextReview - 下次复习时间
 * @returns 友好文本
 */
export function formatNextReview(nextReview: Date | string | null): string {
  if (!nextReview) return '立即复习';

  const reviewDate = typeof nextReview === 'string' ? new Date(nextReview) : nextReview;
  const now = new Date();
  const diffMs = reviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '立即复习';
  if (diffDays === 1) return '明天';
  if (diffDays <= 7) return `${diffDays}天后`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周后`;
  return `${Math.ceil(diffDays / 30)}个月后`;
}

/**
 * 获取掌握程度的显示文本
 *
 * @param level - 掌握程度 (0-5)
 * @returns 显示文本
 */
export function getMasteryLevelText(level: number): string {
  const texts = ['未学习', '初学', '学习中', '熟悉', '掌握', '精通'];
  return texts[Math.min(Math.max(0, level), 5)];
}

/**
 * 获取掌握程度的颜色类名
 *
 * @param level - 掌握程度 (0-5)
 * @returns Tailwind 颜色类名
 */
export function getMasteryLevelColor(level: number): string {
  if (level <= 1) return 'text-red-500';
  if (level <= 2) return 'text-orange-500';
  if (level <= 3) return 'text-yellow-500';
  if (level <= 4) return 'text-green-500';
  return 'text-emerald-500';
}

/**
 * 创建初始复习状态
 */
export function createInitialReviewState(): VocabularyReviewState {
  return {
    intervalDays: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    consecutiveCorrect: 0,
    masteryLevel: 0,
  };
}
