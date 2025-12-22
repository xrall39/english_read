import { NextRequest, NextResponse } from 'next/server';

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/dictionary - 获取已导入的词典列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled_only') === 'true';

    const response = await fetch(
      `${NLP_SERVICE_URL}/dictionary/list?enabled_only=${enabledOnly}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '获取词典列表失败' }));
      return NextResponse.json(
        { error: error.detail || '获取词典列表失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取词典列表失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}
