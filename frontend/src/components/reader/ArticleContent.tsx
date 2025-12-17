'use client';

import { cn } from '@/lib/utils';

interface ArticleContentProps {
  content: string;
  className?: string;
  fontSize?: number;
  lineHeight?: number;
  onTextSelect?: (selectedText: string, position: { x: number; y: number }) => void;
}

export function ArticleContent({
  content,
  className,
  fontSize = 18,
  lineHeight = 1.8,
  onTextSelect,
}: ArticleContentProps) {
  const handleMouseUp = () => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // 获取选中文本的位置
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    onTextSelect(selectedText, {
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  // 将内容按段落分割
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  return (
    <article
      className={cn(
        'prose prose-lg dark:prose-invert max-w-none',
        'selection:bg-primary/20 selection:text-foreground',
        className
      )}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
      }}
      onMouseUp={handleMouseUp}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4 text-foreground">
          {paragraph}
        </p>
      ))}
    </article>
  );
}
