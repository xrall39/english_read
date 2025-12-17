import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '../../../../database/db_manager';
import crypto from 'crypto';
import type { TranslateRequest, TranslateResponse } from '@/types/api';

// 翻译服务配置
const TRANSLATION_SERVICES = {
  // 本地词典（优先级最高）
  local_dict: {
    enabled: true,
    priority: 1,
  },
  // 可以添加其他翻译服务
  // google: { enabled: false, priority: 2 },
  // baidu: { enabled: false, priority: 3 },
};

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

async function translateWithLocalDict(text: string): Promise<string | null> {
  const normalizedText = text.toLowerCase().trim();
  return LOCAL_DICTIONARY[normalizedText] || null;
}

async function translateText(
  text: string,
  targetLanguage: string = 'zh',
  context?: string
): Promise<{
  translated_text: string;
  service: string;
  confidence: number;
}> {
  // 尝试本地词典
  const localTranslation = await translateWithLocalDict(text);
  if (localTranslation) {
    return {
      translated_text: localTranslation,
      service: 'local_dict',
      confidence: 1.0,
    };
  }

  // 如果本地词典没有，返回原文（后续可以集成在线翻译服务）
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
        const db = new DatabaseManager();
        const cachedTranslation = await db.get_translation(
          body.text,
          targetLanguage,
          contextHash
        );

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
        const db = new DatabaseManager();
        await db.cache_translation(
          body.text,
          targetLanguage,
          translation.translated_text,
          translation.service,
          translation.confidence,
          contextHash
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