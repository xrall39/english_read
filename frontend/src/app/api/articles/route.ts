import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '../../../../database/db_manager';

interface CreateArticleRequest {
  title: string;
  content: string;
  source_url?: string;
  author?: string;
  published_date?: string;
  category?: string;
  tags?: string[];
  language?: string;
}

interface ArticleResponse {
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

// NLP服务配置
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

async function analyzeArticleContent(content: string) {
  try {
    const response = await fetch(`${NLP_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
        include_sentences: false,
        include_pos: false,
        include_ner: false,
        include_dependencies: false,
        include_difficulty: true,
      }),
    });

    if (response.ok) {
      const analysis = await response.json();
      return {
        word_count: analysis.word_count,
        sentence_count: analysis.sentence_count,
        difficulty_level: analysis.difficulty?.difficulty_level,
        flesch_score: analysis.difficulty?.flesch_reading_ease,
      };
    }
  } catch (error) {
    console.warn('文章内容分析失败:', error);
  }

  // 如果NLP分析失败，返回基础统计
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  return {
    word_count: wordCount,
    sentence_count: sentenceCount,
    difficulty_level: 'unknown',
    flesch_score: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateArticleRequest = await request.json();

    // 验证必填字段
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    if (body.title.length > 200) {
      return NextResponse.json(
        { error: '标题长度不能超过200字符' },
        { status: 400 }
      );
    }

    if (body.content.length > 50000) {
      return NextResponse.json(
        { error: '内容长度不能超过50000字符' },
        { status: 400 }
      );
    }

    // 分析文章内容
    const analysis = await analyzeArticleContent(body.content);

    // 创建文章
    const db = new DatabaseManager();
    const articleId = await db.create_article(
      body.title,
      body.content,
      {
        source_url: body.source_url,
        author: body.author,
        published_date: body.published_date,
        category: body.category || 'general',
        tags: body.tags,
        language: body.language || 'en',
        ...analysis,
      }
    );

    // 获取创建的文章
    const article = await db.get_article_by_id(articleId);

    if (!article) {
      return NextResponse.json(
        { error: '文章创建失败' },
        { status: 500 }
      );
    }

    const response: ArticleResponse = {
      id: article.id,
      title: article.title,
      content: article.content,
      source_url: article.source_url,
      author: article.author,
      published_date: article.published_date,
      difficulty_level: article.difficulty_level,
      word_count: article.word_count,
      sentence_count: article.sentence_count,
      flesch_score: article.flesch_score,
      category: article.category,
      tags: article.tags,
      language: article.language,
      created_at: article.created_at,
      updated_at: article.updated_at,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('创建文章API错误:', error);

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // 验证参数
    if (limit > 50) {
      return NextResponse.json(
        { error: '每页最多返回50篇文章' },
        { status: 400 }
      );
    }

    const db = new DatabaseManager();
    let articles: any[] = [];

    if (search) {
      // 搜索文章
      articles = await db.search_articles(search, limit);
    } else if (difficulty) {
      // 按难度获取文章
      articles = await db.get_articles_by_difficulty(difficulty, limit);
    } else {
      // 获取所有文章（分页）
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM articles
        ${category ? 'WHERE category = ?' : ''}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const params = category ? [category, limit, offset] : [limit, offset];
      articles = await db.execute_query(query, params as any);
    }

    // 格式化响应
    const formattedArticles: ArticleResponse[] = articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      source_url: article.source_url,
      author: article.author,
      published_date: article.published_date,
      difficulty_level: article.difficulty_level,
      word_count: article.word_count,
      sentence_count: article.sentence_count,
      flesch_score: article.flesch_score,
      category: article.category,
      tags: article.tags,
      language: article.language,
      created_at: article.created_at,
      updated_at: article.updated_at,
    }));

    return NextResponse.json({
      articles: formattedArticles,
      total: formattedArticles.length,
      page,
      limit,
    });

  } catch (error) {
    console.error('获取文章API错误:', error);

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}