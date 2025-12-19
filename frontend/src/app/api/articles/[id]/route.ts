import { NextRequest, NextResponse } from 'next/server';
// TODO: 需要创建 Node.js 版本的数据库管理器
// import { DatabaseManager } from '../../../../../database/db_manager';
import type { ArticleResponse, UpdateArticleRequest } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = parseInt(params.id);

    // 验证ID
    if (isNaN(articleId) || articleId <= 0) {
      return NextResponse.json(
        { error: '无效的文章ID' },
        { status: 400 }
      );
    }

    // TODO: 获取文章 - 暂时返回模拟数据
    // const db = new DatabaseManager();
    // const article = await db.get_article_by_id(articleId);

    // 模拟文章数据（仅用于测试）
    if (articleId !== 1) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    const response: ArticleResponse = {
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
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取文章详情API错误:', error);

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = parseInt(params.id);

    // 验证ID
    if (isNaN(articleId) || articleId <= 0) {
      return NextResponse.json(
        { error: '无效的文章ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 验证更新数据
    if (body.title && body.title.length > 200) {
      return NextResponse.json(
        { error: '标题长度不能超过200字符' },
        { status: 400 }
      );
    }

    if (body.content && body.content.length > 50000) {
      return NextResponse.json(
        { error: '内容长度不能超过50000字符' },
        { status: 400 }
      );
    }

    // TODO: 更新文章功能暂时不可用
    return NextResponse.json(
      { error: '更新文章功能暂时不可用，请稍后再试' },
      { status: 503 }
    );

    return NextResponse.json(response);

  } catch (error) {
    console.error('更新文章API错误:', error);

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = parseInt(params.id);

    // 验证ID
    if (isNaN(articleId) || articleId <= 0) {
      return NextResponse.json(
        { error: '无效的文章ID' },
        { status: 400 }
      );
    }

    // TODO: 删除文章功能暂时不可用
    return NextResponse.json(
      { error: '删除文章功能暂时不可用，请稍后再试' },
      { status: 503 }
    );

  } catch (error) {
    console.error('删除文章API错误:', error);

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}