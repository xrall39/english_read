import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// 数据库路径
const DB_PATH = path.join(process.cwd(), '..', 'database', 'english_reading.db');

// 执行Python数据库操作
async function executePythonDB(operation: string, params: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import sys
import json
sys.path.insert(0, '${path.join(process.cwd(), '..', 'database').replace(/\\/g, '/')}')
from db_manager import DatabaseManager

db = DatabaseManager('${DB_PATH.replace(/\\/g, '/')}')
params = json.loads('${JSON.stringify(params).replace(/'/g, "\\'")}')

try:
    if '${operation}' == 'get_user_vocabulary':
        result = db.get_user_vocabulary(params['user_id'], params.get('limit', 50))
    elif '${operation}' == 'add_vocabulary':
        vocab_id = db.add_vocabulary(
            params['user_id'],
            params['word'],
            definition=params.get('definition'),
            pronunciation=params.get('pronunciation'),
            example_sentence=params.get('example_sentence'),
            translation=params.get('translation'),
            difficulty_level=params.get('difficulty_level', 1),
            source_article_id=params.get('source_article_id'),
            context=params.get('context'),
            word_type=params.get('word_type')
        )
        result = {'id': vocab_id, 'success': True}
    elif '${operation}' == 'update_vocabulary_mastery':
        db.update_vocabulary_mastery(
            params['vocab_id'],
            params['mastery_level'],
            params.get('correct', True)
        )
        result = {'success': True}
    elif '${operation}' == 'delete_vocabulary':
        query = "DELETE FROM vocabulary WHERE id = ? AND user_id = ?"
        db.execute_update(query, (params['vocab_id'], params['user_id']))
        result = {'success': True}
    elif '${operation}' == 'get_vocabulary_by_mastery':
        query = """
            SELECT * FROM vocabulary
            WHERE user_id = ? AND mastery_level <= ?
            ORDER BY first_encountered DESC
            LIMIT ?
        """
        result = db.execute_query(query, (params['user_id'], params['mastery_level'], params.get('limit', 50)))
    elif '${operation}' == 'search_vocabulary':
        query = """
            SELECT * FROM vocabulary
            WHERE user_id = ? AND (word LIKE ? OR translation LIKE ?)
            ORDER BY first_encountered DESC
            LIMIT ?
        """
        keyword = '%' + params['keyword'] + '%'
        result = db.execute_query(query, (params['user_id'], keyword, keyword, params.get('limit', 50)))
    else:
        result = {'error': 'Unknown operation'}
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

    const python = spawn('python', ['-c', pythonScript]);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || `Python process exited with code ${code}`));
        return;
      }
      try {
        const result = JSON.parse(output.trim());
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });
  });
}

// GET: 获取生词本
export async function GET(request: NextRequest) {
  try {
    // TODO: 暂时返回模拟数据
    const mockVocabulary = [
      {
        id: 1,
        word: "example",
        definition: "a thing characteristic of its kind or illustrating a general rule",
        pronunciation: "/ɪɡˈzæmpəl/",
        translation: "例子，示例",
        mastery_level: 2,
        difficulty_level: 1,
        first_encountered: "2024-01-01T00:00:00Z",
        last_reviewed: "2024-01-02T00:00:00Z",
      }
    ];

    return NextResponse.json({
      vocabulary: mockVocabulary,
      total: mockVocabulary.length,
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json(
      { error: '获取生词本失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: 添加生词
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word } = body;

    if (!word) {
      return NextResponse.json(
        { error: '缺少必要参数: word' },
        { status: 400 }
      );
    }

    // TODO: 暂时返回成功响应
    return NextResponse.json({
      success: true,
      message: '生词已添加（模拟）',
      id: Math.floor(Math.random() * 10000),
    });
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    return NextResponse.json(
      { error: '添加生词失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT: 更新生词掌握程度
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vocab_id, mastery_level } = body;

    if (!vocab_id || mastery_level === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数: vocab_id, mastery_level' },
        { status: 400 }
      );
    }

    // TODO: 暂时返回成功响应
    return NextResponse.json({ success: true, message: '掌握程度已更新（模拟）' });
  } catch (error) {
    console.error('Error updating vocabulary mastery:', error);
    return NextResponse.json(
      { error: '更新掌握程度失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: 删除生词
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vocabId = parseInt(searchParams.get('vocab_id') || '0', 10);

    if (!vocabId) {
      return NextResponse.json(
        { error: '缺少必要参数: vocab_id' },
        { status: 400 }
      );
    }

    // TODO: 暂时返回成功响应
    return NextResponse.json({ success: true, message: '生词已删除（模拟）' });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    return NextResponse.json(
      { error: '删除生词失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
