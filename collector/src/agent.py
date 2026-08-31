"""
AR-IMMS Tiến trình Thu thập Dữ liệu Collector Agent
Tiến trình daemon tự động thu thập thông số phần cứng (CPU, RAM, Đĩa cứng, Nhiệt độ, Mạng) cho các máy chủ server và truyền tải về Backend API.
"""
import os
import sys
import time
import json
import requests
import signal
from dotenv import load_dotenv

from metrics import SystemMetricsCollector
from buffer import TelemetryBufferQueue

# Nạp biến môi trường từ tệp .env
load_dotenv()

NODE_ID = int(os.environ.get("NODE_ID", 1))
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
API_KEY = os.environ.get("API_KEY", "agent_secret_key_2026")
COLLECT_INTERVAL = int(os.environ.get("COLLECT_INTERVAL", 5))
MAX_BUFFER_SIZE = int(os.environ.get("MAX_BUFFER_SIZE", 1000))

# Mã màu ANSI định dạng nhật ký trên Console
COLOR_RESET = "\033[0m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_CYAN = "\033[96m"

class CollectorAgentDaemon:
    def __init__(self):
        self.collector = SystemMetricsCollector()
        self.buffer = TelemetryBufferQueue(max_size=MAX_BUFFER_SIZE)
        self.is_running = True
        self.is_online = False
        
        signal.signal(signal.SIGINT, self._handle_exit)
        signal.signal(signal.SIGTERM, self._handle_exit)

    def _handle_exit(self, signum, frame):
        print(f"\n{COLOR_YELLOW}[AR-IMMS Agent] Đang dừng tiến trình Collector Agent an toàn...{COLOR_RESET}")
        self.is_running = False
        sys.exit(0)

    def send_telemetry_payload(self, payload: dict) -> bool:
        """Gửi bản tin dữ liệu đo đạc telemetry tới endpoint Backend API."""
        url = f"{BACKEND_URL.rstrip('/')}/api/v1/telemetry"
        headers = {
            "Content-Type": "application/json",
            "X-Agent-API-Key": API_KEY,
            "X-Node-ID": str(NODE_ID)
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=3.0)
            if response.status_code in (200, 201):
                return True
            else:
                return False
        except Exception:
            return False

    def flush_buffered_telemetry(self):
        """Phát bù toàn bộ bản ghi telemetry lưu đệm offline khi khôi phục kết nối mạng."""
        buffer_len = self.buffer.size()
        if buffer_len == 0:
            return

        print(f"{COLOR_CYAN}[Phát bù Dữ liệu] Đang phát bù {buffer_len} bản ghi telemetry offline về Backend...{COLOR_RESET}")
        flushed_count = 0
        batch = self.buffer.dequeue_batch(batch_size=50)
        
        for item in batch:
            if self.send_telemetry_payload(item):
                flushed_count += 1
            else:
                # Đưa lại item vào hàng đợi nếu lại mất kết nối
                self.buffer.enqueue(item)
                self.is_online = False
                print(f"{COLOR_RED}[Phát bù Dữ liệu] Mất kết nối khi đang phát bù. Đã đưa lại dữ liệu vào hàng đợi.{COLOR_RESET}")
                return

        print(f"{COLOR_GREEN}[Phát bù Thành công] Đã phát bù thành công {flushed_count} bản ghi. Số bản tin còn lại: {self.buffer.size()}{COLOR_RESET}")

    def run(self):
        print(f"{COLOR_CYAN}===================================================={COLOR_RESET}")
        print(f"{COLOR_CYAN}    AR-IMMS DATA COLLECTOR AGENT DAEMON (psutil)    {COLOR_RESET}")
        print(f"{COLOR_CYAN}===================================================={COLOR_RESET}")
        print(f"ID Máy chủ (Node ID):  {NODE_ID}")
        print(f"Tên Máy (Hostname):    {self.collector.hostname}")
        print(f"Địa chỉ IP / MAC:      {self.collector.ip_address} | {self.collector.mac_address}")
        print(f"Hệ điều hành OS:       {self.collector.os_name} {self.collector.os_version}")
        print(f"Máy chủ Backend:       {BACKEND_URL}")
        print(f"Chu kỳ thu thập:       {COLLECT_INTERVAL} giây")
        print(f"{COLOR_CYAN}----------------------------------------------------{COLOR_RESET}")

        while self.is_running:
            start_loop_time = time.time()
            
            # 1. Thu thập dữ liệu phần cứng qua psutil
            snapshot = self.collector.collect_all_telemetry(node_id=NODE_ID)
            metrics = snapshot["metrics"]
            
            # Chuỗi định dạng thông số console
            cpu_str = f"CPU: {metrics['cpu_usage_percent']}%"
            ram_str = f"RAM: {metrics['memory_usage_percent']}% ({metrics['memory_used_gb']}/{metrics['memory_total_gb']}GB)"
            disk_str = f"Disk: {metrics['disk_usage_percent']}%"
            temp_str = f"Temp: {metrics['temperature_celsius']}°C"
            net_str = f"Rx: {metrics['network_rx_kbps']} KB/s | Tx: {metrics['network_tx_kbps']} KB/s"

            # 2. Truyền tải hoặc Lưu đệm dữ liệu
            success = self.send_telemetry_payload(snapshot)
            
            if success:
                if not self.is_online:
                    self.is_online = True
                    print(f"{COLOR_GREEN}[Trạng thái Mạng] Đã kết nối thành công tới Backend Server.{COLOR_RESET}")
                
                # Phát bù bộ nhớ đệm nếu có bản tin đọng
                if not self.buffer.is_empty():
                    self.flush_buffered_telemetry()
                    
                status_label = f"{COLOR_GREEN}[ONLINE - ĐÃ GỬI]{COLOR_RESET}"
            else:
                if self.is_online:
                    self.is_online = False
                    print(f"{COLOR_RED}[Trạng thái Mạng] Không thể kết nối tới Backend. Chuyển sang chế độ lưu đệm offline.{COLOR_RESET}")
                
                self.buffer.enqueue(snapshot)
                status_label = f"{COLOR_YELLOW}[OFFLINE - LƯU ĐỆM (Hàng đợi: {self.buffer.size()}/{MAX_BUFFER_SIZE})]{COLOR_RESET}"

            print(f"{status_label} {time.strftime('%H:%M:%S')} | {cpu_str} | {ram_str} | {disk_str} | {temp_str} | {net_str}")

            # Đợi cho tới chu kỳ thu thập tiếp theo
            elapsed = time.time() - start_loop_time
            sleep_duration = max(COLLECT_INTERVAL - elapsed, 0.5)
            time.sleep(sleep_duration)

if __name__ == "__main__":
    daemon = CollectorAgentDaemon()
    daemon.run()
