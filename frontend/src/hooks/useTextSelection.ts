'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TextSelection {
  text: string;
  position: {
    x: number;
    y: number;
  };
}

export function useTextSelection(containerRef?: React.RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const isSelectingRef = useRef(false);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleMouseUp = useCallback(() => {
    // 延迟处理，确保选择完成
    setTimeout(() => {
      const windowSelection = window.getSelection();
      if (!windowSelection || windowSelection.isCollapsed) {
        return;
      }

      const selectedText = windowSelection.toString().trim();
      if (!selectedText) {
        return;
      }

      // 检查选择是否在容器内
      if (containerRef?.current) {
        const range = windowSelection.getRangeAt(0);
        if (!containerRef.current.contains(range.commonAncestorContainer)) {
          return;
        }
      }

      // 获取选中文本的位置
      const range = windowSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText,
        position: {
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + window.scrollY,
        },
      });
    }, 10);
  }, [containerRef]);

  const handleMouseDown = useCallback(() => {
    isSelectingRef.current = true;
  }, []);

  // 点击其他地方时清除选择
  const handleClickOutside = useCallback((e: MouseEvent) => {
    // 如果点击的是弹窗内部，不清除选择
    const target = e.target as HTMLElement;
    if (target.closest('[data-translation-popup]')) {
      return;
    }

    // 如果正在选择文本，不清除
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    clearSelection();
  }, [clearSelection]);

  // ESC键清除选择
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSelection();
    }
  }, [clearSelection]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseUp, handleMouseDown, handleClickOutside, handleKeyDown]);

  return {
    selection,
    clearSelection,
  };
}
