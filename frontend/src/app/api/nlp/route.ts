import { NextRequest, NextResponse } from 'next/server';

// NLP服务配置
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

interface NLPAnalysisRequest {
  text: string;
  include_sentences?: boolean;
  include_pos?: boolean;
  include_ner?: boolean;
  include_dependencies?: boolean;
  include_difficulty?: boolean;
}

interface NLPAnalysisResponse {
  text: string;
  sentences?: Array<{
    text: string;
    start: number;
    end: number;
    tokens: Array<{
      text: string;
      lemma: string;
      pos: string;
      tag: string;
      is_alpha: boolean;
      is_stop: boolean;
      start: number;
      end: number;
    }>;
  }>;
  entities?: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    description: string;
  }>;
  difficulty?: {
    flesch_reading_ease: number;
    flesch_kincaid_grade: number;
    automated_readability_index: number;
    coleman_liau_index: number;
    gunning_fog: number;
    smog_index: number;
    difficulty_level: string;
  };
  word_count: number;
  sentence_count: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: NLPAnalysisRequest = await request.json();

    // 验证请求数据
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: '文本内容不能为空' },
        { status: 400 }
      );
    }

    if (body.text.length > 10000) {
      return NextResponse.json(
        { error: '文本长度不能超过10000字符' },
        { status: 400 }
      );
    }

    // 构建请求数据
    const nlpRequest = {
      text: body.text,
      include_sentences: body.include_sentences ?? true,
      include_pos: body.include_pos ?? true,
      include_ner: body.include_ner ?? true,
      include_dependencies: body.include_dependencies ?? false,
      include_difficulty: body.include_difficulty ?? true,
    };

    // 调用NLP服务
    const response = await fetch(`${NLP_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nlpRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NLP服务错误:', errorText);

      return NextResponse.json(
        { error: 'NLP分析服务暂时不可用' },
        { status: 503 }
      );
    }

    const analysisResult: NLPAnalysisResponse = await response.json();

    // 返回分析结果
    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('NLP API错误:', error);

    // 检查是否是网络连接错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'NLP服务连接失败，请确保服务正在运行' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 健康检查 - 检查NLP服务状态
    const response = await fetch(`${NLP_SERVICE_URL}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'NLP服务不可用',
          nlp_service_url: NLP_SERVICE_URL
        },
        { status: 503 }
      );
    }

    const healthData = await response.json();

    return NextResponse.json({
      status: 'healthy',
      message: 'NLP API正常运行',
      nlp_service: healthData,
      nlp_service_url: NLP_SERVICE_URL
    });

  } catch (error) {
    console.error('NLP健康检查错误:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'NLP服务连接失败',
        nlp_service_url: NLP_SERVICE_URL
      },
      { status: 503 }
    );
  }
}