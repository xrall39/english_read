import { NextRequest, NextResponse } from 'next/server';

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/dictionary/scan - 扫描可导入的词典文件
 */
export async function GET() {
  try {
    const response = await fetch(
      `${NLP_SERVICE_URL}/dictionary/scan`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '扫描词典文件失败' }));
      return NextResponse.json(
        { error: error.detail || '扫描词典文件失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('扫描词典文件失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}
