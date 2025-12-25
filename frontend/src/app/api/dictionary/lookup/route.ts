import { NextRequest, NextResponse } from 'next/server';

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/dictionary/lookup - 查询单词
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const dictionaryIds = searchParams.get('dictionary_ids');

    if (!word) {
      return NextResponse.json(
        { error: '单词不能为空' },
        { status: 400 }
      );
    }

    let url = `${NLP_SERVICE_URL}/dictionary/lookup?word=${encodeURIComponent(word)}`;
    if (dictionaryIds) {
      url += `&dictionary_ids=${encodeURIComponent(dictionaryIds)}`;
    }

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '查询单词失败' }));
      return NextResponse.json(
        { error: error.detail || '查询单词失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('查询单词失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}

/**
 * POST /api/dictionary/lookup - 查询单词（POST方式）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.word) {
      return NextResponse.json(
        { error: '单词不能为空' },
        { status: 400 }
      );
    }

    const response = await fetch(`${NLP_SERVICE_URL}/dictionary/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '查询单词失败' }));
      return NextResponse.json(
        { error: error.detail || '查询单词失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('查询单词失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}
