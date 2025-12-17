'use client';

import { cn } from '@/lib/utils';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function MainLayout({
  children,
  className,
  showHeader = true,
  maxWidth = 'xl',
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <Header />}
      <main
        className={cn(
          'flex-1 w-full mx-auto px-4 py-6 md:px-6 md:py-8',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {children}
      </main>
      <footer className="border-t border-border py-4">
        <div className={cn('mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground', maxWidthClasses[maxWidth])}>
          <p>英语阅读助手 - 让英语学习更轻松</p>
        </div>
      </footer>
    </div>
  );
}
