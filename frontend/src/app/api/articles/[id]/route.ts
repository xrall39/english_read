import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '../../../../../database/db_manager';

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

    // 获取文章
    const db = new DatabaseManager();
    const article = await db.get_article_by_id(articleId);

    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
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

    const db = new DatabaseManager();

    // 检查文章是否存在
    const existingArticle = await db.get_article_by_id(articleId);
    if (!existingArticle) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (body.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(body.title);
    }

    if (body.content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(body.content);
    }

    if (body.author !== undefined) {
      updateFields.push('author = ?');
      updateValues.push(body.author);
    }

    if (body.category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(body.category);
    }

    if (body.tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(body.tags));
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: '没有提供要更新的字段' },
        { status: 400 }
      );
    }

    // 添加更新时间
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(articleId);

    // 执行更新
    const updateQuery = `
      UPDATE articles
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await db.execute_update(updateQuery, updateValues as any);

    // 返回更新后的文章
    const updatedArticle = await db.get_article_by_id(articleId);

    const response: ArticleResponse = {
      id: updatedArticle!.id,
      title: updatedArticle!.title,
      content: updatedArticle!.content,
      source_url: updatedArticle!.source_url,
      author: updatedArticle!.author,
      published_date: updatedArticle!.published_date,
      difficulty_level: updatedArticle!.difficulty_level,
      word_count: updatedArticle!.word_count,
      sentence_count: updatedArticle!.sentence_count,
      flesch_score: updatedArticle!.flesch_score,
      category: updatedArticle!.category,
      tags: updatedArticle!.tags,
      language: updatedArticle!.language,
      created_at: updatedArticle!.created_at,
      updated_at: updatedArticle!.updated_at,
    };

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

    const db = new DatabaseManager();

    // 检查文章是否存在
    const existingArticle = await db.get_article_by_id(articleId);
    if (!existingArticle) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    // 删除文章
    const deleteQuery = 'DELETE FROM articles WHERE id = ?';
    const rowsAffected = await db.execute_update(deleteQuery, [articleId] as any);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: '删除失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '文章删除成功' },
      { status: 200 }
    );

  } catch (error) {
    console.error('删除文章API错误:', error);

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}