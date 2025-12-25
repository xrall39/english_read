'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, FolderOpen, Book, Settings, Trash2, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// 类型定义
interface DictionaryFile {
  path: string;
  name: string;
  format: string;
  encoding: string;
  size: number;
  size_mb: number;
}

interface Dictionary {
  id: number;
  name: string;
  description?: string;
  source_format: string;
  entry_count: number;
  priority: number;
  is_enabled: boolean;
  import_status: 'pending' | 'importing' | 'completed' | 'failed';
  import_progress: number;
  import_error?: string;
  created_at: string;
}

export default function DictionaryPage() {
  const [availableFiles, setAvailableFiles] = useState<DictionaryFile[]>([]);
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [importingFile, setImportingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 扫描可导入文件
  const scanFiles = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/dictionary/scan');
      if (!response.ok) throw new Error('扫描失败');
      const data = await response.json();
      setAvailableFiles(data.files || []);
    } catch (err) {
      setError('扫描词典文件失败');
      console.error(err);
    } finally {
      setScanning(false);
    }
  }, []);

  // 获取已导入词典列表
  const fetchDictionaries = useCallback(async () => {
    try {
      const response = await fetch('/api/dictionary');
      if (!response.ok) throw new Error('获取词典列表失败');
      const data = await response.json();
      setDictionaries(data.dictionaries || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([scanFiles(), fetchDictionaries()]);
      setLoading(false);
    };
    loadData();
  }, [scanFiles, fetchDictionaries]);

  // 导入词典
  const handleImport = async (file: DictionaryFile) => {
    const name = prompt('请输入词典名称:', file.name.replace(/\.[^.]+$/, ''));
    if (!name) return;

    setImportingFile(file.name);
    setError(null);

    try {
      const response = await fetch('/api/dictionary/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          name,
          description: `从 ${file.name} 导入`,
          priority: 100,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '导入失败');
      }

      // 开始轮询导入状态
      setTimeout(() => {
        fetchDictionaries();
        setImportingFile(null);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      setImportingFile(null);
    }
  };

  // 切换词典启用状态
  const toggleEnabled = async (dict: Dictionary) => {
    try {
      const response = await fetch(`/api/dictionary/${dict.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !dict.is_enabled }),
      });

      if (!response.ok) throw new Error('更新失败');
      await fetchDictionaries();
    } catch (err) {
      setError('更新词典状态失败');
      console.error(err);
    }
  };

  // 删除词典
  const handleDelete = async (dict: Dictionary) => {
    if (!confirm(`确定要删除词典 "${dict.name}" 吗？此操作不可恢复。`)) return;

    try {
      const response = await fetch(`/api/dictionary/${dict.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');
      await fetchDictionaries();
    } catch (err) {
      setError('删除词典失败');
      console.error(err);
    }
  };

  // 格式化文件大小
  const formatSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'importing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Book className="w-6 h-6" />
          词典管理
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* 可导入文件 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              可导入文件
              <span className="text-sm text-muted-foreground font-normal">
                (data/dictionaries/)
              </span>
            </h2>
            <button
              onClick={scanFiles}
              disabled={scanning}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>

          {availableFiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
              <p>暂无可导入的词典文件</p>
              <p className="text-sm mt-2">
                请将词典文件（.csv, .json, .mdx）放到 data/dictionaries/ 目录
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-4 bg-card border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatSize(file.size_mb)} · {file.format.toUpperCase()} 格式
                    </div>
                  </div>
                  <button
                    onClick={() => handleImport(file)}
                    disabled={importingFile === file.name}
                    className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                  >
                    {importingFile === file.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    导入
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 已导入词典 */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Book className="w-5 h-5" />
            已导入词典
          </h2>

          {dictionaries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
              <p>暂无已导入的词典</p>
              <p className="text-sm mt-2">请先导入词典文件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dictionaries.map((dict) => (
                <div
                  key={dict.id}
                  className="p-4 bg-card border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(dict.import_status)}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {dict.name}
                          {!dict.is_enabled && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              已禁用
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {dict.entry_count.toLocaleString()} 词条 ·
                          优先级 {dict.priority} ·
                          {dict.source_format.toUpperCase()} 格式
                        </div>
                        {dict.import_status === 'importing' && (
                          <div className="mt-2">
                            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${dict.import_progress * 100}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              导入中 {(dict.import_progress * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                        {dict.import_status === 'failed' && dict.import_error && (
                          <div className="text-sm text-red-500 mt-1">
                            错误: {dict.import_error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleEnabled(dict)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          dict.is_enabled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {dict.is_enabled ? '启用' : '禁用'}
                      </button>
                      <button
                        onClick={() => handleDelete(dict)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 使用说明 */}
        <section className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium mb-2">使用说明</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. 将词典文件放到 <code className="px-1 bg-muted rounded">data/dictionaries/</code> 目录</li>
            <li>2. 点击"刷新"按钮扫描可导入文件</li>
            <li>3. 点击"导入"按钮开始导入词典</li>
            <li>4. 导入完成后，翻译时会自动查询已启用的词典</li>
          </ul>
          <div className="mt-3 text-sm text-muted-foreground">
            <strong>支持格式：</strong>ECDICT CSV（推荐）、JSON、MDX
          </div>
        </section>
      </div>
    </div>
  );
}
