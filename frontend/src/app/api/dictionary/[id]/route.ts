import { NextRequest, NextResponse } from 'next/server';

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dictionary/[id] - 获取词典详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const dictionaryId = parseInt(id, 10);

    if (isNaN(dictionaryId)) {
      return NextResponse.json(
        { error: '无效的词典ID' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${NLP_SERVICE_URL}/dictionary/${dictionaryId}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '获取词典详情失败' }));
      return NextResponse.json(
        { error: error.detail || '获取词典详情失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取词典详情失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}

/**
 * PUT /api/dictionary/[id] - 更新词典信息
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const dictionaryId = parseInt(id, 10);

    if (isNaN(dictionaryId)) {
      return NextResponse.json(
        { error: '无效的词典ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${NLP_SERVICE_URL}/dictionary/${dictionaryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '更新词典失败' }));
      return NextResponse.json(
        { error: error.detail || '更新词典失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('更新词典失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}

/**
 * DELETE /api/dictionary/[id] - 删除词典
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const dictionaryId = parseInt(id, 10);

    if (isNaN(dictionaryId)) {
      return NextResponse.json(
        { error: '无效的词典ID' },
        { status: 400 }
      );
    }

    const response = await fetch(`${NLP_SERVICE_URL}/dictionary/${dictionaryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '删除词典失败' }));
      return NextResponse.json(
        { error: error.detail || '删除词典失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('删除词典失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}
