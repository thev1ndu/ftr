import sqlite3
import json
from app.core.config import get_settings

class SQLiteMemory:
    def __init__(self):
        settings = get_settings()
        self.db_path = settings.DB_PATH
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT,
                    tool_calls TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def add_message(self, session_id, role, content, tool_calls=None):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_history (session_id, role, content, tool_calls)
                VALUES (?, ?, ?, ?)
            """, (session_id, role, content, json.dumps(tool_calls) if tool_calls else None))
            conn.commit()

    def get_messages(self, session_id):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT role, content, tool_calls FROM chat_history
                WHERE session_id = ?
                ORDER BY timestamp ASC
            """, (session_id,))
            rows = cursor.fetchall()
            
            messages = []
            for row in rows:
                msg = {
                    "role": row["role"],
                    "content": row["content"]
                }
                if row["tool_calls"]:
                    msg["tool_calls"] = json.loads(row["tool_calls"])
                messages.append(msg)
            return messages

def get_memory(session_id: str):
    return SQLiteMemory()
