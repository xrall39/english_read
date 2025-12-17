/**
 * 共享API类型定义
 * 统一前端和API路由的类型定义
 */

// ============================================
// 文章相关类型
// ============================================

/** 创建文章请求 */
export interface CreateArticleRequest {
  title: string;
  content: string;
  source_url?: string;
  author?: string;
  published_date?: string;
  category?: string;
  tags?: string[];
  language?: string;
}

/** 更新文章请求 */
export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  author?: string;
  category?: string;
  tags?: string[];
}

/** 文章响应 */
export interface ArticleResponse {
  id: number;
  title: string;
  content: string;
  source_url?: string;
  author?: string;
  published_date?: string;
  difficulty_level?: string;
  word_count?: number;
  sentence_count?: number;
  flesch_score?: number;
  category?: string;
  tags?: string[];
  language: string;
  created_at: string;
  updated_at: string;
}

/** 文章列表响应 */
export interface ArticleListResponse {
  articles: ArticleResponse[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// NLP分析相关类型
// ============================================

/** NLP分析请求 */
export interface NLPAnalysisRequest {
  text: string;
  include_sentences?: boolean;
  include_pos?: boolean;
  include_ner?: boolean;
  include_dependencies?: boolean;
  include_difficulty?: boolean;
}

/** Token信息 */
export interface TokenInfo {
  text: string;
  lemma: string;
  pos: string;
  tag: string;
  is_alpha: boolean;
  is_stop: boolean;
  start: number;
  end: number;
}

/** 句子信息 */
export interface SentenceInfo {
  text: string;
  start: number;
  end: number;
  tokens: TokenInfo[];
}

/** 实体信息 */
export interface EntityInfo {
  text: string;
  label: string;
  start: number;
  end: number;
  description: string;
}

/** 难度评估信息 */
export interface DifficultyInfo {
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  automated_readability_index: number;
  coleman_liau_index: number;
  gunning_fog: number;
  smog_index: number;
  difficulty_level: DifficultyLevel;
}

/** 难度等级枚举 */
export type DifficultyLevel =
  | 'very_easy'
  | 'easy'
  | 'fairly_easy'
  | 'standard'
  | 'fairly_difficult'
  | 'difficult'
  | 'very_difficult'
  | 'unknown';

/** NLP分析响应 */
export interface NLPAnalysisResponse {
  text: string;
  sentences?: SentenceInfo[];
  entities?: EntityInfo[];
  difficulty?: DifficultyInfo;
  word_count: number;
  sentence_count: number;
}

/** NLP健康检查响应 */
export interface NLPHealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  nlp_service?: {
    status: string;
    model_loaded: boolean;
    model_name: string;
  };
  nlp_service_url: string;
}

// ============================================
// 翻译相关类型
// ============================================

/** 翻译请求 */
export interface TranslateRequest {
  text: string;
  target_language?: string;
  context?: string;
  use_cache?: boolean;
}

/** 翻译响应 */
export interface TranslateResponse {
  original_text: string;
  translated_text: string;
  target_language: string;
  translation_service: TranslationService;
  confidence_score: number;
  from_cache: boolean;
  context_hash?: string;
}

/** 翻译服务类型 */
export type TranslationService =
  | 'local_dict'
  | 'google'
  | 'baidu'
  | 'ai'
  | 'fallback';

// ============================================
// 用户相关类型
// ============================================

/** 用户信息 */
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  preferences?: UserPreferences;
  reading_level: ReadingLevel;
}

/** 用户偏好设置 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  font_size?: number;
  reading_mode?: 'normal' | 'immersive';
  auto_translate?: boolean;
}

/** 阅读等级 */
export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced';

// ============================================
// 生词本相关类型
// ============================================

/** 生词信息 */
export interface VocabularyItem {
  id: number;
  user_id: number;
  word: string;
  definition?: string;
  pronunciation?: string;
  example_sentence?: string;
  translation?: string;
  difficulty_level: number;
  mastery_level: number;
  first_encountered: string;
  last_reviewed?: string;
  review_count: number;
  correct_count: number;
  source_article_id?: number;
  context?: string;
  word_type?: string;
}

/** 添加生词请求 */
export interface AddVocabularyRequest {
  word: string;
  definition?: string;
  pronunciation?: string;
  example_sentence?: string;
  translation?: string;
  difficulty_level?: number;
  source_article_id?: number;
  context?: string;
  word_type?: string;
}

// ============================================
// 阅读历史相关类型
// ============================================

/** 阅读历史记录 */
export interface ReadingHistory {
  id: number;
  user_id: number;
  article_id: number;
  reading_progress: number;
  reading_time: number;
  words_looked_up: number;
  last_position: number;
  started_at: string;
  completed: boolean;
  completed_at?: string;
  comprehension_score?: number;
  // 关联的文章信息
  title?: string;
  difficulty_level?: string;
}

// ============================================
// 学习统计相关类型
// ============================================

/** 学习统计 */
export interface LearningStats {
  id: number;
  user_id: number;
  date: string;
  words_learned: number;
  articles_read: number;
  reading_time: number;
  vocabulary_reviewed: number;
  accuracy_rate: number;
}

// ============================================
// 通用API响应类型
// ============================================

/** API错误响应 */
export interface APIErrorResponse {
  error: string;
  details?: string;
}

/** API成功消息响应 */
export interface APIMessageResponse {
  message: string;
}

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
