# -*- coding: utf-8 -*-
import sqlite3
from pathlib import Path

def init_database():
    current_dir = Path(__file__).parent
    db_path = current_dir / "english_reading.db"
    schema_path = current_dir / "schema.sql"

    print(f"正在初始化数据库: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        cursor.executescript(schema_sql)
        conn.commit()

        print("数据库初始化成功")

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"创建了 {len(tables)} 个表")

        conn.close()
        return True

    except Exception as e:
        print(f"初始化失败: {e}")
        return False

if __name__ == "__main__":
    init_database()