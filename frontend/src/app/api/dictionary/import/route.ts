import { NextRequest, NextResponse } from 'next/server';

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

interface ImportRequest {
  file_name: string;
  name: string;
  description?: string;
  priority?: number;
}

/**
 * POST /api/dictionary/import - 导入词典文件
 */
export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();

    // 验证必填字段
    if (!body.file_name || !body.name) {
      return NextResponse.json(
        { error: '文件名和词典名称不能为空' },
        { status: 400 }
      );
    }

    const response = await fetch(`${NLP_SERVICE_URL}/dictionary/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: body.file_name,
        name: body.name,
        description: body.description || '',
        priority: body.priority || 100,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '导入词典失败' }));
      return NextResponse.json(
        { error: error.detail || '导入词典失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('导入词典失败:', error);
    return NextResponse.json(
      { error: '词典服务暂时不可用' },
      { status: 503 }
    );
  }
}
