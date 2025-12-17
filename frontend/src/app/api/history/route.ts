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
    if '${operation}' == 'get_reading_history':
        result = db.get_reading_history(params['user_id'], params.get('limit', 20))
    elif '${operation}' == 'update_reading_progress':
        db.update_reading_progress(
            params['user_id'],
            params['article_id'],
            params['progress'],
            params.get('reading_time', 0),
            params.get('words_looked_up', 0),
            params.get('last_position', 0)
        )
        result = {'success': True}
    elif '${operation}' == 'mark_article_completed':
        db.mark_article_completed(
            params['user_id'],
            params['article_id'],
            params.get('comprehension_score')
        )
        result = {'success': True}
    elif '${operation}' == 'delete_reading_history':
        # 删除阅读历史记录
        query = "DELETE FROM reading_history WHERE user_id = ? AND article_id = ?"
        db.execute_update(query, (params['user_id'], params['article_id']))
        result = {'success': True}
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

// GET: 获取阅读历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('user_id') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const history = await executePythonDB('get_reading_history', {
      user_id: userId,
      limit: limit,
    });

    return NextResponse.json({
      history: history,
      total: Array.isArray(history) ? history.length : 0,
    });
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return NextResponse.json(
      { error: '获取阅读历史失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: 更新阅读进度
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id = 1, article_id, progress, reading_time, words_looked_up, last_position } = body;

    if (!article_id) {
      return NextResponse.json(
        { error: '缺少必要参数: article_id' },
        { status: 400 }
      );
    }

    await executePythonDB('update_reading_progress', {
      user_id,
      article_id,
      progress: progress || 0,
      reading_time: reading_time || 0,
      words_looked_up: words_looked_up || 0,
      last_position: last_position || 0,
    });

    return NextResponse.json({ success: true, message: '阅读进度已更新' });
  } catch (error) {
    console.error('Error updating reading progress:', error);
    return NextResponse.json(
      { error: '更新阅读进度失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT: 标记文章为已完成
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id = 1, article_id, comprehension_score } = body;

    if (!article_id) {
      return NextResponse.json(
        { error: '缺少必要参数: article_id' },
        { status: 400 }
      );
    }

    await executePythonDB('mark_article_completed', {
      user_id,
      article_id,
      comprehension_score,
    });

    return NextResponse.json({ success: true, message: '文章已标记为完成' });
  } catch (error) {
    console.error('Error marking article completed:', error);
    return NextResponse.json(
      { error: '标记文章完成失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: 删除阅读历史记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('user_id') || '1', 10);
    const articleId = parseInt(searchParams.get('article_id') || '0', 10);

    if (!articleId) {
      return NextResponse.json(
        { error: '缺少必要参数: article_id' },
        { status: 400 }
      );
    }

    await executePythonDB('delete_reading_history', {
      user_id: userId,
      article_id: articleId,
    });

    return NextResponse.json({ success: true, message: '阅读历史已删除' });
  } catch (error) {
    console.error('Error deleting reading history:', error);
    return NextResponse.json(
      { error: '删除阅读历史失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
