import { NextRequest, NextResponse } from 'next/server';

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dictionary/[id]/status - 获取词典导入状态
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
      `${NLP_SERVICE_URL}/dictionary/${dictionaryId}/status`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '获取导入状态失败' }));
      return NextResponse.json(
        { error: error.detail || '获取导入状态失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取导入状态失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}
