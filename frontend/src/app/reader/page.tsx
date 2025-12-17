'use client';

import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout';
import { Reader } from '@/components/reader';
import { TranslationPopup } from '@/components/translation';
import { useTextSelection } from '@/hooks';
import { cn } from '@/lib/utils';
import { FileText, Upload, Loader2 } from 'lucide-react';
import type { ArticleResponse } from '@/types/api';

// 示例文章数据
const sampleArticle: ArticleResponse = {
  id: 1,
  title: 'The Benefits of Reading in a Foreign Language',
  content: `Reading in a foreign language is one of the most effective ways to improve your language skills. It exposes you to new vocabulary, grammar structures, and cultural contexts that you might not encounter in everyday conversation.

When you read extensively, you naturally absorb the patterns and rhythms of the language. This passive learning complements active study methods like grammar exercises and vocabulary drills. Over time, you'll find that words and phrases you've encountered in your reading start appearing in your own speech and writing.

One of the key benefits of reading is that it allows you to learn at your own pace. Unlike listening to native speakers or watching movies, you can pause, re-read difficult passages, and look up unfamiliar words without missing anything. This makes reading an ideal activity for learners at all levels.

To get the most out of your reading practice, choose materials that are slightly above your current level. This concept, known as "comprehensible input plus one," ensures that you're challenged enough to learn new things while still understanding the overall meaning of the text.

Start with shorter texts like news articles or blog posts, and gradually work your way up to longer works like novels. Don't worry about understanding every single word – focus on getting the gist of the content and enjoying the reading experience.

Remember that consistency is more important than intensity. Reading for 15-20 minutes every day will yield better results than occasional marathon sessions. Make reading a habit, and you'll be amazed at how quickly your language skills improve.`,
  author: 'Language Learning Expert',
  difficulty_level: 'fairly_easy',
  word_count: 267,
  sentence_count: 14,
  flesch_score: 58.5,
  category: 'education',
  tags: ['language learning', 'reading', 'study tips'],
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function ReaderPage() {
  const [article, setArticle] = useState<ArticleResponse | null>(sampleArticle);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  const { selection, clearSelection } = useTextSelection(readerRef);

  const handleAddToVocabulary = (word: string, translation: string) => {
    console.log('Adding to vocabulary:', word, '->', translation);
    // TODO: 调用API添加到生词本
  };

  const handleImportArticle = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      // 调用API创建文章
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: inputText.split('\n')[0].slice(0, 100) || '导入的文章',
          content: inputText,
        }),
      });

      if (response.ok) {
        const newArticle = await response.json();
        setArticle(newArticle);
        setShowInput(false);
        setInputText('');
      } else {
        console.error('Failed to import article');
      }
    } catch (error) {
      console.error('Error importing article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout showHeader={!article} maxWidth="2xl">
      {!article || showInput ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-2">导入文章</h1>
              <p className="text-muted-foreground">
                粘贴英语文章内容，开始阅读和学习
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="在此粘贴英语文章内容..."
                className={cn(
                  'w-full h-64 p-4 rounded-lg border border-input bg-background',
                  'resize-none focus:outline-none focus:ring-2 focus:ring-ring',
                  'placeholder:text-muted-foreground'
                )}
              />

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleImportArticle}
                  disabled={!inputText.trim() || isLoading}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg',
                    'bg-primary text-primary-foreground font-medium',
                    'hover:bg-primary/90 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  导入并开始阅读
                </button>

                {showInput && article && (
                  <button
                    onClick={() => setShowInput(false)}
                    className={cn(
                      'px-6 py-3 rounded-lg border border-input',
                      'hover:bg-accent transition-colors'
                    )}
                  >
                    取消
                  </button>
                )}
              </div>

              {!showInput && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  或者{' '}
                  <button
                    onClick={() => setArticle(sampleArticle)}
                    className="text-primary hover:underline"
                  >
                    使用示例文章
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative" ref={readerRef}>
          {/* 返回按钮 */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setShowInput(true)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'border border-input hover:bg-accent transition-colors text-sm'
              )}
            >
              <Upload className="h-4 w-4" />
              导入新文章
            </button>
          </div>

          {/* 阅读器 */}
          <Reader article={article} />

          {/* 翻译弹窗 */}
          {selection && (
            <TranslationPopup
              text={selection.text}
              position={selection.position}
              onClose={clearSelection}
              onAddToVocabulary={handleAddToVocabulary}
            />
          )}
        </div>
      )}
    </MainLayout>
  );
}
