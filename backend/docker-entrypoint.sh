#!/bin/sh
set -e

echo "[Entrypoint] Chờ CSDL PostgreSQL sẵn sàng..."

python - <<'EOF'
import os
import sys
import time
import psycopg2

db_url = os.environ.get("DATABASE_URI") or os.environ.get("POSTGRES_DATABASE_URL")
if not db_url or db_url.startswith("sqlite"):
    print("[Entrypoint] CSDL sử dụng SQLite local hoặc chưa cấu hình URL. Tiếp tục khởi động...")
    sys.exit(0)

max_retries = 30
retry_interval = 2

for i in range(max_retries):
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print("[Entrypoint] Kết nối PostgreSQL thành công!")
        sys.exit(0)
    except Exception as e:
        print(f"[Entrypoint] Đang chờ CSDL sẵn sàng ({i+1}/{max_retries})...")
        time.sleep(retry_interval)

print("[Entrypoint] LỖI: Hết thời gian chờ kết nối CSDL PostgreSQL!")
sys.exit(1)
EOF

if [ "$AUTO_SEED" = "true" ] || [ "$AUTO_SEED" = "1" ]; then
    echo "[Entrypoint] Bắt đầu khởi tạo bảng và seed dữ liệu mẫu (seed_full_demo.py)..."
    python seed_full_demo.py || echo "[Entrypoint] Cảnh báo: Seed dữ liệu gặp sự cố hoặc dữ liệu đã tồn tại."
fi

echo "[Entrypoint] Khởi chạy Backend Server (Flask & WebSocket Gateway) trên cổng ${PORT:-5000}..."
exec "$@"
