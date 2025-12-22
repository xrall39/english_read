# -*- coding: utf-8 -*-
"""
词典解析器模块
支持多种词典格式的解析：ECDICT CSV, JSON, MDX
"""

import csv
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Generator, Any, Tuple
import logging
import chardet

logger = logging.getLogger(__name__)


class DictionaryParser:
    """词典解析器基类"""

    SUPPORTED_FORMATS = ['csv', 'ecdict', 'json', 'mdx']

    @staticmethod
    def detect_format(file_path: str) -> str:
        """
        检测词典文件格式

        Args:
            file_path: 文件路径

        Returns:
            格式标识: csv, ecdict, json, mdx
        """
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == '.mdx':
            return 'mdx'
        elif ext == '.json':
            return 'json'
        elif ext == '.csv':
            # 检查是否是ECDICT格式
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    first_line = f.readline()
                    # ECDICT的CSV有特定的列名
                    if 'word' in first_line and 'translation' in first_line:
                        if 'phonetic' in first_line or 'exchange' in first_line:
                            return 'ecdict'
            except Exception:
                pass
            return 'csv'

        return 'unknown'

    @staticmethod
    def detect_encoding(file_path: str) -> str:
        """检测文件编码"""
        with open(file_path, 'rb') as f:
            raw_data = f.read(10000)  # 读取前10KB用于检测
            result = chardet.detect(raw_data)
            return result.get('encoding', 'utf-8') or 'utf-8'

    @staticmethod
    def get_file_info(file_path: str) -> Dict[str, Any]:
        """
        获取词典文件信息

        Returns:
            包含格式、大小、编码等信息的字典
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        file_format = DictionaryParser.detect_format(file_path)
        encoding = DictionaryParser.detect_encoding(file_path)
        file_size = path.stat().st_size

        return {
            'path': str(path.absolute()),
            'name': path.name,
            'format': file_format,
            'encoding': encoding,
            'size': file_size,
            'size_mb': round(file_size / (1024 * 1024), 2)
        }

    @staticmethod
    def create_parser(file_path: str) -> 'DictionaryParser':
        """
        根据文件格式创建对应的解析器

        Args:
            file_path: 文件路径

        Returns:
            对应格式的解析器实例
        """
        file_format = DictionaryParser.detect_format(file_path)

        if file_format == 'ecdict':
            return ECDICTParser(file_path)
        elif file_format == 'csv':
            return CSVParser(file_path)
        elif file_format == 'json':
            return JSONParser(file_path)
        elif file_format == 'mdx':
            return MDXParser(file_path)
        else:
            raise ValueError(f"不支持的词典格式: {file_format}")

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.encoding = self.detect_encoding(file_path)

    def parse(self) -> Generator[Dict[str, Any], None, None]:
        """
        解析词典文件，返回词条生成器

        Yields:
            词条字典，包含 word, translation 等字段
        """
        raise NotImplementedError

    def get_total_count(self) -> int:
        """获取词条总数（估算）"""
        raise NotImplementedError

    def get_preview(self, count: int = 10) -> List[Dict[str, Any]]:
        """获取前N条词条预览"""
        entries = []
        for i, entry in enumerate(self.parse()):
            if i >= count:
                break
            entries.append(entry)
        return entries


class ECDICTParser(DictionaryParser):
    """
    ECDICT CSV格式解析器

    ECDICT字段说明：
    - word: 单词
    - phonetic: 音标
    - definition: 英文释义
    - translation: 中文翻译
    - pos: 词性
    - collins: 柯林斯星级 (1-5)
    - oxford: 是否牛津核心词汇 (0/1)
    - tag: 标签 (如 cet4, cet6, toefl, ielts, gre)
    - bnc: BNC词频排名
    - frq: 当代语料库词频排名
    - exchange: 词形变化 (如 p:went/d:gone/i:going/3:goes)
    """

    # ECDICT exchange字段的变化类型映射
    EXCHANGE_TYPES = {
        'p': 'past',      # 过去式
        'd': 'done',      # 过去分词
        'i': 'ing',       # 现在分词
        '3': 'third',     # 第三人称单数
        'r': 'er',        # 比较级
        't': 'est',       # 最高级
        's': 'plural',    # 复数
        '0': 'lemma',     # 原形
        '1': 'lemma'      # 原形（另一种标记）
    }

    def __init__(self, file_path: str):
        super().__init__(file_path)

    def _parse_exchange(self, exchange_str: str) -> Optional[Dict[str, str]]:
        """
        解析词形变化字符串

        Args:
            exchange_str: 如 "p:went/d:gone/i:going/3:goes"

        Returns:
            词形变化字典，如 {"past": "went", "done": "gone", ...}
        """
        if not exchange_str:
            return None

        result = {}
        parts = exchange_str.split('/')
        for part in parts:
            if ':' in part:
                type_code, form = part.split(':', 1)
                type_name = self.EXCHANGE_TYPES.get(type_code, type_code)
                result[type_name] = form

        return result if result else None

    def _parse_tags(self, tag_str: str) -> Optional[List[str]]:
        """解析标签字符串"""
        if not tag_str:
            return None
        # 标签可能用空格分隔
        tags = [t.strip().upper() for t in tag_str.split() if t.strip()]
        return tags if tags else None

    def parse(self) -> Generator[Dict[str, Any], None, None]:
        """解析ECDICT CSV文件"""
        with open(self.file_path, 'r', encoding=self.encoding, errors='ignore') as f:
            reader = csv.DictReader(f)

            for row in reader:
                word = row.get('word', '').strip()
                translation = row.get('translation', '').strip()

                # 跳过无效词条
                if not word or not translation:
                    continue

                entry = {
                    'word': word,
                    'translation': translation,
                }

                # 音标
                phonetic = row.get('phonetic', '').strip()
                if phonetic:
                    entry['phonetic_uk'] = phonetic

                # 英文释义
                definition = row.get('definition', '').strip()
                if definition:
                    entry['definition'] = definition

                # 词性
                pos = row.get('pos', '').strip()
                if pos:
                    entry['pos'] = pos

                # 柯林斯星级
                collins = row.get('collins', '').strip()
                if collins and collins.isdigit():
                    entry['collins_star'] = int(collins)

                # 牛津核心词汇
                oxford = row.get('oxford', '').strip()
                if oxford == '1':
                    entry['oxford_level'] = 'core'

                # 标签
                tags = self._parse_tags(row.get('tag', ''))
                if tags:
                    entry['tags'] = tags

                # BNC词频排名
                bnc = row.get('bnc', '').strip()
                if bnc and bnc.isdigit():
                    entry['bnc_rank'] = int(bnc)

                # 当代语料库词频排名
                frq = row.get('frq', '').strip()
                if frq and frq.isdigit():
                    entry['frq_rank'] = int(frq)

                # 词形变化
                exchange = self._parse_exchange(row.get('exchange', ''))
                if exchange:
                    entry['exchange'] = exchange

                yield entry

    def get_total_count(self) -> int:
        """获取词条总数"""
        count = 0
        with open(self.file_path, 'r', encoding=self.encoding, errors='ignore') as f:
            # 跳过标题行
            next(f, None)
            for _ in f:
                count += 1
        return count


class CSVParser(DictionaryParser):
    """
    通用CSV格式解析器

    支持的列名（不区分大小写）：
    - word/单词/英文: 单词
    - translation/翻译/中文/释义: 翻译
    - phonetic/音标: 音标
    - definition/英文释义: 英文释义
    """

    WORD_COLUMNS = ['word', '单词', '英文', 'english']
    TRANSLATION_COLUMNS = ['translation', '翻译', '中文', '释义', 'chinese', 'meaning']
    PHONETIC_COLUMNS = ['phonetic', '音标', 'pronunciation']
    DEFINITION_COLUMNS = ['definition', '英文释义', 'english_definition']

    def __init__(self, file_path: str):
        super().__init__(file_path)
        self.column_mapping = {}

    def _detect_columns(self, headers: List[str]) -> Dict[str, str]:
        """检测列名映射"""
        mapping = {}
        headers_lower = [h.lower().strip() for h in headers]

        for i, header in enumerate(headers_lower):
            if header in self.WORD_COLUMNS:
                mapping['word'] = headers[i]
            elif header in self.TRANSLATION_COLUMNS:
                mapping['translation'] = headers[i]
            elif header in self.PHONETIC_COLUMNS:
                mapping['phonetic'] = headers[i]
            elif header in self.DEFINITION_COLUMNS:
                mapping['definition'] = headers[i]

        return mapping

    def parse(self) -> Generator[Dict[str, Any], None, None]:
        """解析CSV文件"""
        with open(self.file_path, 'r', encoding=self.encoding, errors='ignore') as f:
            reader = csv.DictReader(f)

            # 检测列名映射
            if reader.fieldnames:
                self.column_mapping = self._detect_columns(reader.fieldnames)

            if 'word' not in self.column_mapping or 'translation' not in self.column_mapping:
                raise ValueError("CSV文件必须包含单词和翻译列")

            for row in reader:
                word = row.get(self.column_mapping['word'], '').strip()
                translation = row.get(self.column_mapping['translation'], '').strip()

                if not word or not translation:
                    continue

                entry = {
                    'word': word,
                    'translation': translation,
                }

                if 'phonetic' in self.column_mapping:
                    phonetic = row.get(self.column_mapping['phonetic'], '').strip()
                    if phonetic:
                        entry['phonetic_uk'] = phonetic

                if 'definition' in self.column_mapping:
                    definition = row.get(self.column_mapping['definition'], '').strip()
                    if definition:
                        entry['definition'] = definition

                yield entry

    def get_total_count(self) -> int:
        """获取词条总数"""
        count = 0
        with open(self.file_path, 'r', encoding=self.encoding, errors='ignore') as f:
            next(f, None)  # 跳过标题行
            for _ in f:
                count += 1
        return count


class JSONParser(DictionaryParser):
    """
    JSON格式解析器

    支持两种格式：
    1. 数组格式: [{"word": "hello", "translation": "你好"}, ...]
    2. 对象格式: {"hello": "你好", "world": "世界", ...}
    """

    def __init__(self, file_path: str):
        super().__init__(file_path)

    def parse(self) -> Generator[Dict[str, Any], None, None]:
        """解析JSON文件"""
        with open(self.file_path, 'r', encoding=self.encoding, errors='ignore') as f:
            data = json.load(f)

        if isinstance(data, list):
            # 数组格式
            for item in data:
                if isinstance(item, dict):
                    word = item.get('word', '').strip()
                    translation = item.get('translation', item.get('trans', '')).strip()

                    if word and translation:
                        entry = {'word': word, 'translation': translation}

                        # 复制其他字段
                        for key in ['phonetic_uk', 'phonetic_us', 'phonetic', 'pos',
                                   'definition', 'exchange', 'examples', 'tags']:
                            if key in item and item[key]:
                                if key == 'phonetic':
                                    entry['phonetic_uk'] = item[key]
                                else:
                                    entry[key] = item[key]

                        yield entry

        elif isinstance(data, dict):
            # 对象格式: {"word": "translation"}
            for word, value in data.items():
                if isinstance(value, str):
                    yield {'word': word, 'translation': value}
                elif isinstance(value, dict):
                    translation = value.get('translation', value.get('trans', ''))
                    if translation:
                        entry = {'word': word, 'translation': translation}
                        for key in ['phonetic_uk', 'phonetic_us', 'pos', 'definition']:
                            if key in value:
                                entry[key] = value[key]
                        yield entry

    def get_total_count(self) -> int:
        """获取词条总数"""
        with open(self.file_path, 'r', encoding=self.encoding, errors='ignore') as f:
            data = json.load(f)

        if isinstance(data, list):
            return len(data)
        elif isinstance(data, dict):
            return len(data)
        return 0


class MDXParser(DictionaryParser):
    """
    MDX (MDict) 格式解析器

    MDX是MDict词典软件使用的格式，包含压缩的词条数据。
    需要 readmdict 库来解析。
    """

    def __init__(self, file_path: str):
        super().__init__(file_path)
        self._mdx = None

    def _load_mdx(self):
        """加载MDX文件"""
        if self._mdx is None:
            try:
                from readmdict import MDX
                self._mdx = MDX(self.file_path)
            except ImportError:
                raise ImportError("需要安装 readmdict 库: pip install readmdict")
            except Exception as e:
                raise ValueError(f"无法解析MDX文件: {e}")

    def _clean_html(self, html_content: str) -> str:
        """
        清理HTML内容，提取纯文本

        MDX词条内容通常是HTML格式
        """
        if not html_content:
            return ''

        # 移除HTML标签
        text = re.sub(r'<[^>]+>', ' ', html_content)
        # 处理HTML实体
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&amp;', '&')
        text = text.replace('&quot;', '"')
        # 清理多余空白
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def _extract_phonetic(self, content: str) -> Optional[str]:
        """从内容中提取音标"""
        # 尝试匹配常见的音标格式
        patterns = [
            r'\[([^\]]+)\]',  # [音标]
            r'/([^/]+)/',     # /音标/
            r'【([^】]+)】',   # 【音标】
        ]

        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                phonetic = match.group(1).strip()
                # 验证是否像音标（包含音标字符）
                if any(c in phonetic for c in 'əɪʊæɑɔʌɛɜːˈˌ'):
                    return phonetic

        return None

    def parse(self) -> Generator[Dict[str, Any], None, None]:
        """解析MDX文件"""
        self._load_mdx()

        items = self._mdx.items()

        for word_bytes, content_bytes in items:
            try:
                # 解码
                word = word_bytes.decode('utf-8') if isinstance(word_bytes, bytes) else str(word_bytes)
                content = content_bytes.decode('utf-8') if isinstance(content_bytes, bytes) else str(content_bytes)

                word = word.strip()
                if not word:
                    continue

                # 清理HTML获取翻译文本
                translation = self._clean_html(content)
                if not translation:
                    continue

                entry = {
                    'word': word,
                    'translation': translation[:2000],  # 限制长度
                }

                # 尝试提取音标
                phonetic = self._extract_phonetic(content)
                if phonetic:
                    entry['phonetic_uk'] = phonetic

                yield entry

            except Exception as e:
                logger.warning(f"解析MDX词条失败: {e}")
                continue

    def get_total_count(self) -> int:
        """获取词条总数"""
        self._load_mdx()
        return len(list(self._mdx.keys()))


def scan_dictionary_files(directory: str) -> List[Dict[str, Any]]:
    """
    扫描目录中的词典文件

    Args:
        directory: 目录路径

    Returns:
        词典文件信息列表
    """
    supported_extensions = {'.csv', '.json', '.mdx'}
    files = []

    dir_path = Path(directory)
    if not dir_path.exists():
        return files

    for file_path in dir_path.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            try:
                info = DictionaryParser.get_file_info(str(file_path))
                files.append(info)
            except Exception as e:
                logger.warning(f"获取文件信息失败 {file_path}: {e}")

    # 按文件名排序
    files.sort(key=lambda x: x['name'].lower())
    return files
