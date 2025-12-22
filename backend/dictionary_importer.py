# -*- coding: utf-8 -*-
"""
词典导入器模块
负责将解析后的词典数据批量导入数据库
"""

import asyncio
import logging
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor

# 添加database目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent / 'database'))

from db_manager import DatabaseManager
from dictionary_parser import DictionaryParser, scan_dictionary_files

logger = logging.getLogger(__name__)


class DictionaryImporter:
    """词典导入器"""

    # 批量插入大小
    BATCH_SIZE = 1000

    # 进度更新间隔（条数）
    PROGRESS_UPDATE_INTERVAL = 5000

    def __init__(self, db_path: Optional[str] = None):
        """
        初始化导入器

        Args:
            db_path: 数据库路径，为None则使用默认路径
        """
        if db_path is None:
            db_path = str(Path(__file__).parent.parent / 'database' / 'english_reading.db')
        self.db = DatabaseManager(db_path)

        # 导入状态跟踪
        self._import_tasks: Dict[int, Dict[str, Any]] = {}

    def get_import_status(self, dictionary_id: int) -> Optional[Dict[str, Any]]:
        """
        获取导入状态

        Args:
            dictionary_id: 词典ID

        Returns:
            导入状态信息
        """
        # 先检查内存中的任务状态
        if dictionary_id in self._import_tasks:
            return self._import_tasks[dictionary_id]

        # 从数据库获取
        dictionary = self.db.get_dictionary_by_id(dictionary_id)
        if dictionary:
            return {
                'dictionary_id': dictionary_id,
                'status': dictionary['import_status'],
                'progress': dictionary['import_progress'],
                'entry_count': dictionary['entry_count'],
                'error': dictionary.get('import_error')
            }
        return None

    def import_dictionary(
        self,
        file_path: str,
        name: str,
        description: str = '',
        priority: int = 100,
        progress_callback: Optional[Callable[[int, float, int], None]] = None
    ) -> int:
        """
        同步导入词典

        Args:
            file_path: 词典文件路径
            name: 词典名称
            description: 词典描述
            priority: 优先级
            progress_callback: 进度回调函数 (dictionary_id, progress, entry_count)

        Returns:
            词典ID
        """
        # 获取文件信息
        file_info = DictionaryParser.get_file_info(file_path)

        # 检查是否已存在同名词典
        existing = self.db.get_dictionary_by_name(name)
        if existing:
            raise ValueError(f"词典 '{name}' 已存在")

        # 创建词典记录
        dictionary_id = self.db.create_dictionary(
            name=name,
            source_format=file_info['format'],
            description=description,
            source_file=file_path,
            file_size=file_info['size'],
            priority=priority,
            import_status='importing',
            import_progress=0.0
        )

        # 初始化任务状态
        self._import_tasks[dictionary_id] = {
            'dictionary_id': dictionary_id,
            'status': 'importing',
            'progress': 0.0,
            'entry_count': 0,
            'error': None,
            'start_time': time.time()
        }

        try:
            # 创建解析器
            parser = DictionaryParser.create_parser(file_path)

            # 获取总数（用于计算进度）
            total_count = parser.get_total_count()
            logger.info(f"开始导入词典 '{name}'，预计 {total_count} 条词条")

            # 批量导入
            batch = []
            imported_count = 0
            last_progress_update = 0

            for entry in parser.parse():
                batch.append(entry)

                if len(batch) >= self.BATCH_SIZE:
                    # 批量插入
                    self.db.add_dictionary_entries_batch(dictionary_id, batch)
                    imported_count += len(batch)
                    batch = []

                    # 更新进度
                    if imported_count - last_progress_update >= self.PROGRESS_UPDATE_INTERVAL:
                        progress = min(imported_count / total_count, 0.99) if total_count > 0 else 0.5
                        self._update_progress(dictionary_id, progress, imported_count)
                        last_progress_update = imported_count

                        if progress_callback:
                            progress_callback(dictionary_id, progress, imported_count)

            # 插入剩余数据
            if batch:
                self.db.add_dictionary_entries_batch(dictionary_id, batch)
                imported_count += len(batch)

            # 完成导入
            self.db.update_import_progress(
                dictionary_id,
                progress=1.0,
                status='completed',
                entry_count=imported_count
            )

            self._import_tasks[dictionary_id].update({
                'status': 'completed',
                'progress': 1.0,
                'entry_count': imported_count,
                'end_time': time.time()
            })

            elapsed = time.time() - self._import_tasks[dictionary_id]['start_time']
            logger.info(f"词典 '{name}' 导入完成，共 {imported_count} 条词条，耗时 {elapsed:.1f} 秒")

            if progress_callback:
                progress_callback(dictionary_id, 1.0, imported_count)

            return dictionary_id

        except Exception as e:
            error_msg = str(e)
            logger.error(f"导入词典 '{name}' 失败: {error_msg}")

            # 更新失败状态
            self.db.update_import_progress(
                dictionary_id,
                progress=0.0,
                status='failed',
                error=error_msg
            )

            self._import_tasks[dictionary_id].update({
                'status': 'failed',
                'error': error_msg
            })

            raise

    def _update_progress(self, dictionary_id: int, progress: float, entry_count: int):
        """更新导入进度"""
        self.db.update_import_progress(
            dictionary_id,
            progress=progress,
            status='importing',
            entry_count=entry_count
        )

        if dictionary_id in self._import_tasks:
            self._import_tasks[dictionary_id].update({
                'progress': progress,
                'entry_count': entry_count
            })

    async def import_dictionary_async(
        self,
        file_path: str,
        name: str,
        description: str = '',
        priority: int = 100
    ) -> int:
        """
        异步导入词典（在后台线程中执行）

        Args:
            file_path: 词典文件路径
            name: 词典名称
            description: 词典描述
            priority: 优先级

        Returns:
            词典ID
        """
        loop = asyncio.get_event_loop()
        executor = ThreadPoolExecutor(max_workers=1)

        return await loop.run_in_executor(
            executor,
            self.import_dictionary,
            file_path,
            name,
            description,
            priority,
            None
        )

    def delete_dictionary(self, dictionary_id: int) -> bool:
        """
        删除词典

        Args:
            dictionary_id: 词典ID

        Returns:
            是否成功
        """
        result = self.db.delete_dictionary(dictionary_id)

        # 清理任务状态
        if dictionary_id in self._import_tasks:
            del self._import_tasks[dictionary_id]

        return result > 0

    def lookup_word(self, word: str) -> list:
        """
        查询单词

        Args:
            word: 要查询的单词

        Returns:
            词条列表
        """
        return self.db.lookup_word(word)

    def get_all_dictionaries(self, enabled_only: bool = False) -> list:
        """获取所有词典"""
        return self.db.get_all_dictionaries(enabled_only)

    def update_dictionary(self, dictionary_id: int, **kwargs) -> int:
        """更新词典信息"""
        return self.db.update_dictionary(dictionary_id, **kwargs)


# 全局导入器实例
_importer: Optional[DictionaryImporter] = None


def get_importer() -> DictionaryImporter:
    """获取全局导入器实例"""
    global _importer
    if _importer is None:
        _importer = DictionaryImporter()
    return _importer


def scan_available_dictionaries(directory: str) -> list:
    """
    扫描可用的词典文件

    Args:
        directory: 目录路径

    Returns:
        词典文件信息列表
    """
    return scan_dictionary_files(directory)
