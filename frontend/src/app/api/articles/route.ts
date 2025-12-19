import { NextRequest, NextResponse } from 'next/server';
// TODO: 需要创建 Node.js 版本的数据库管理器
// import { DatabaseManager } from '../../../../database/db_manager';
import type {
  CreateArticleRequest,
  ArticleResponse,
  ArticleListResponse,
} from '@/types/api';

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

    // TODO: 创建文章 - 暂时返回模拟数据
    // const db = new DatabaseManager();
    // const articleId = await db.create_article(...);

    // 模拟创建的文章数据
    const articleId = Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    const response: ArticleResponse = {
      id: articleId,
      title: body.title,
      content: body.content,
      source_url: body.source_url,
      author: body.author,
      published_date: body.published_date,
      difficulty_level: analysis.difficulty_level,
      word_count: analysis.word_count,
      sentence_count: analysis.sentence_count,
      flesch_score: analysis.flesch_score,
      category: body.category || 'general',
      tags: body.tags,
      language: body.language || 'en',
      created_at: now,
      updated_at: now,
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

    // TODO: 从数据库获取文章 - 暂时返回模拟数据
    // const db = new DatabaseManager();

    // 模拟文章数据
    const mockArticles = [
      {
        id: 1,
        title: "Sample English Article",
        content: "This is a sample English article for testing purposes. It contains some basic English text to demonstrate the reading functionality.",
        source_url: "https://example.com/article1",
        author: "Test Author",
        published_date: "2024-01-01",
        difficulty_level: "intermediate",
        word_count: 25,
        sentence_count: 2,
        flesch_score: 65.5,
        category: "general",
        tags: ["sample", "test"],
        language: "en",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }
    ];

    // 根据搜索条件过滤（简单实现）
    let filteredArticles = mockArticles;
    if (search) {
      filteredArticles = mockArticles.filter(article =>
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (difficulty) {
      filteredArticles = filteredArticles.filter(article =>
        article.difficulty_level === difficulty
      );
    }
    if (category) {
      filteredArticles = filteredArticles.filter(article =>
        article.category === category
      );
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + limit);

    // 格式化响应
    const formattedArticles: ArticleResponse[] = paginatedArticles;

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