'use client';

import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { BookOpen, Moon, Sun, Monitor, Book } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeIcon = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Monitor className="h-5 w-5" />,
  };

  const themeLabel = {
    light: '浅色',
    dark: '深色',
    system: '系统',
  };

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo和标题 */}
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">英语阅读助手</span>
        </div>

        {/* 导航链接 */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            首页
          </a>
          <a
            href="/reader"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            阅读器
          </a>
          <a
            href="/vocabulary"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            生词本
          </a>
          <a
            href="/learn"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            学习
          </a>
          <a
            href="/stats"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            统计
          </a>
          <a
            href="/history"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            历史
          </a>
          <a
            href="/dictionary"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
          >
            <Book className="h-4 w-4" />
            词典
          </a>
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 主题切换按钮 */}
          <button
            onClick={cycleTheme}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2',
              'text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            title={`当前主题: ${themeLabel[theme]}`}
          >
            {themeIcon[theme]}
            <span className="hidden sm:inline">{themeLabel[theme]}</span>
          </button>

          {/* 移动端菜单按钮 */}
          <button
            className={cn(
              'md:hidden inline-flex items-center justify-center rounded-md p-2',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
