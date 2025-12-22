import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { TranslateRequest, TranslateResponse } from '@/types/api';

// NLP服务地址（用于词典查询）
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

// 翻译服务配置
const TRANSLATION_SERVICES = {
  // 本地词典（优先级最高）
  local_dict: {
    enabled: true,
    priority: 1,
  },
  // 数据库词典（优先级次高）
  database_dict: {
    enabled: true,
    priority: 2,
  },
  // 可以添加其他翻译服务
  // google: { enabled: false, priority: 3 },
  // baidu: { enabled: false, priority: 4 },
};

// 内存缓存（临时替代数据库缓存）
const translationCache = new Map<string, {
  translated_text: string;
  translation_service: string;
  confidence_score: number;
  created_at: number;
}>();

// 缓存过期时间（1小时）
const CACHE_EXPIRY_MS = 60 * 60 * 1000;

// 简单的本地词典
const LOCAL_DICTIONARY: Record<string, string> = {
  // 常用单词
  'hello': '你好',
  'world': '世界',
  'the': '这个，那个',
  'and': '和，与',
  'or': '或者',
  'but': '但是',
  'in': '在...里面',
  'on': '在...上面',
  'at': '在',
  'to': '到，向',
  'for': '为了',
  'of': '的',
  'with': '和，用',
  'by': '通过，被',

  // 阅读相关
  'reading': '阅读',
  'article': '文章',
  'text': '文本',
  'word': '单词',
  'sentence': '句子',
  'paragraph': '段落',
  'vocabulary': '词汇',
  'dictionary': '词典',
  'translation': '翻译',
  'language': '语言',
  'english': '英语',
  'chinese': '中文',

  // 学习相关
  'learn': '学习',
  'study': '学习，研究',
  'education': '教育',
  'knowledge': '知识',
  'skill': '技能',
  'practice': '练习',
  'exercise': '练习，锻炼',
  'test': '测试',
  'exam': '考试',
  'grade': '年级，成绩',

  // 常用形容词
  'good': '好的',
  'bad': '坏的',
  'big': '大的',
  'small': '小的',
  'new': '新的',
  'old': '旧的',
  'easy': '容易的',
  'difficult': '困难的',
  'important': '重要的',
  'interesting': '有趣的',
};

function generateContextHash(context?: string): string | undefined {
  if (!context) return undefined;
  return crypto.createHash('md5').update(context).digest('hex').substring(0, 16);
}

// 生成缓存键
function generateCacheKey(text: string, targetLanguage: string, contextHash?: string): string {
  const baseKey = `${text}:${targetLanguage}`;
  return contextHash ? `${baseKey}:${contextHash}` : baseKey;
}

// 从内存缓存获取翻译
function getCachedTranslation(cacheKey: string) {
  const cached = translationCache.get(cacheKey);
  if (!cached) return null;

  // 检查是否过期
  if (Date.now() - cached.created_at > CACHE_EXPIRY_MS) {
    translationCache.delete(cacheKey);
    return null;
  }

  return cached;
}

// 保存翻译到内存缓存
function setCachedTranslation(
  cacheKey: string,
  translatedText: string,
  service: string,
  confidence: number
) {
  translationCache.set(cacheKey, {
    translated_text: translatedText,
    translation_service: service,
    confidence_score: confidence,
    created_at: Date.now(),
  });
}

async function translateWithLocalDict(text: string): Promise<string | null> {
  const normalizedText = text.toLowerCase().trim();
  return LOCAL_DICTIONARY[normalizedText] || null;
}

// 数据库词典查询
interface DictionaryEntry {
  word: string;
  translation: string;
  phonetic_uk?: string;
  phonetic_us?: string;
  pos?: string[];
  definition?: string;
  examples?: string[];
  tags?: string[];
  collins_star?: number;
  dictionary_name?: string;
}

async function translateWithDatabaseDict(text: string): Promise<{
  translation: string;
  entry: DictionaryEntry;
} | null> {
  try {
    const response = await fetch(
      `${NLP_SERVICE_URL}/dictionary/lookup?word=${encodeURIComponent(text.trim())}`,
      { cache: 'no-store' }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.entries && data.entries.length > 0) {
      const entry = data.entries[0] as DictionaryEntry;
      return {
        translation: entry.translation,
        entry,
      };
    }
    return null;
  } catch (error) {
    console.warn('数据库词典查询失败:', error);
    return null;
  }
}

// DeepLX 翻译服务
async function translateWithDeepLX(text: string, targetLang: string): Promise<string | null> {
  const apiUrl = process.env.DEEPLX_API_URL;
  if (!apiUrl) return null;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: 'EN',
        target_lang: targetLang.toUpperCase() === 'ZH' ? 'ZH' : targetLang.toUpperCase(),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data || null;
  } catch {
    return null;
  }
}

async function translateText(
  text: string,
  targetLanguage: string = 'zh',
  context?: string
): Promise<{
  translated_text: string;
  service: string;
  confidence: number;
  dictionary_info?: DictionaryEntry;
}> {
  // 1. 尝试本地词典（优先级最高）
  const localTranslation = await translateWithLocalDict(text);
  if (localTranslation) {
    return {
      translated_text: localTranslation,
      service: 'local_dict',
      confidence: 1.0,
    };
  }

  // 2. 尝试数据库词典查询
  const dictResult = await translateWithDatabaseDict(text);
  if (dictResult) {
    return {
      translated_text: dictResult.translation,
      service: `dictionary:${dictResult.entry.dictionary_name || 'unknown'}`,
      confidence: 0.98,
      dictionary_info: dictResult.entry,
    };
  }

  // 3. 尝试 DeepLX 翻译服务
  const deeplxTranslation = await translateWithDeepLX(text, targetLanguage);
  if (deeplxTranslation) {
    return {
      translated_text: deeplxTranslation,
      service: 'deeplx',
      confidence: 0.95,
    };
  }

  // 4. 如果都没有，返回未找到提示
  return {
    translated_text: `[未找到翻译: ${text}]`,
    service: 'fallback',
    confidence: 0.0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();

    // 验证请求数据
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: '文本内容不能为空' },
        { status: 400 }
      );
    }

    if (body.text.length > 1000) {
      return NextResponse.json(
        { error: '文本长度不能超过1000字符' },
        { status: 400 }
      );
    }

    const targetLanguage = body.target_language || 'zh';
    const useCache = body.use_cache !== false; // 默认使用缓存
    const contextHash = generateContextHash(body.context);

    let translationResult: TranslateResponse;

    // 尝试从缓存获取翻译
    if (useCache) {
      try {
        const cacheKey = generateCacheKey(body.text, targetLanguage, contextHash);
        const cachedTranslation = getCachedTranslation(cacheKey);

        if (cachedTranslation) {
          translationResult = {
            original_text: body.text,
            translated_text: cachedTranslation.translated_text,
            target_language: targetLanguage,
            translation_service: cachedTranslation.translation_service,
            confidence_score: cachedTranslation.confidence_score,
            from_cache: true,
            context_hash: contextHash,
          };

          return NextResponse.json(translationResult);
        }
      } catch (error) {
        console.warn('缓存查询失败:', error);
        // 继续执行翻译，不因缓存失败而中断
      }
    }

    // 执行翻译
    const translation = await translateText(body.text, targetLanguage, body.context);

    translationResult = {
      original_text: body.text,
      translated_text: translation.translated_text,
      target_language: targetLanguage,
      translation_service: translation.service,
      confidence_score: translation.confidence,
      from_cache: false,
      context_hash: contextHash,
    };

    // 缓存翻译结果
    if (useCache && translation.confidence > 0) {
      try {
        const cacheKey = generateCacheKey(body.text, targetLanguage, contextHash);
        setCachedTranslation(
          cacheKey,
          translation.translated_text,
          translation.service,
          translation.confidence
        );
      } catch (error) {
        console.warn('缓存保存失败:', error);
        // 不影响翻译结果返回
      }
    }

    return NextResponse.json(translationResult);

  } catch (error) {
    console.error('翻译API错误:', error);

    return NextResponse.json(
      { error: '翻译服务暂时不可用' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json(
        { error: '缺少text参数' },
        { status: 400 }
      );
    }

    // 简单的GET请求翻译（不使用上下文）
    const translation = await translateText(text);

    return NextResponse.json({
      original_text: text,
      translated_text: translation.translated_text,
      target_language: 'zh',
      translation_service: translation.service,
      confidence_score: translation.confidence,
      from_cache: false,
    });

  } catch (error) {
    console.error('翻译GET API错误:', error);

    return NextResponse.json(
      { error: '翻译服务暂时不可用' },
      { status: 500 }
    );
  }
}