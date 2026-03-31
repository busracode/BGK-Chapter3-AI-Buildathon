import sqlite3
import os

db_path = r"c:\Users\bsrac\OneDrive\Masaüstü\AI Buildathon\backend\hayat_agaci.db"

if not os.path.exists(db_path):
    print("Database not found.")
    exit(0)

print(f"Opening database: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column(table, column, type):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type};")
        print(f"Added column {column} to {table}.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {column} already exists in {table}.")
        else:
            print(f"Error adding {column}: {e}")

# Apply migrations
print("Starting migrations...")
add_column("users", "surname", "VARCHAR")
add_column("users", "interests", "TEXT")
add_column("users", "speaking_style", "VARCHAR")
add_column("users", "expertise_level", "VARCHAR")
add_column("users", "emergency_contact_name", "VARCHAR")
add_column("users", "emergency_contact_phone", "VARCHAR")
add_column("users", "updated_at", "DATETIME")

try:
    conn.commit()
    print("Changes committed.")
except Exception as e:
    print(f"Commit failed: {e}")

conn.close()
print("Migration script finished.")
