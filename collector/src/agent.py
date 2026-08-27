"""
AR-IMMS Data Collector Agent
Automated telemetry gathering daemon for infrastructure nodes.
Collects CPU, RAM, Disk, Temperature, Network rates using psutil and streams data to Backend.
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

# Load environment variables
load_dotenv()

NODE_ID = int(os.environ.get("NODE_ID", 1))
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
API_KEY = os.environ.get("API_KEY", "agent_secret_key_2026")
COLLECT_INTERVAL = int(os.environ.get("COLLECT_INTERVAL", 5))
MAX_BUFFER_SIZE = int(os.environ.get("MAX_BUFFER_SIZE", 1000))

# ANSI Color Codes for Terminal Output
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
        print(f"\n{COLOR_YELLOW}[AR-IMMS Agent] Gracefully shutting down agent daemon...{COLOR_RESET}")
        self.is_running = False
        sys.exit(0)

    def send_telemetry_payload(self, payload: dict) -> bool:
        """Sends a telemetry snapshot payload to the Backend API endpoint."""
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
        """Flushes buffered offline telemetry records upon network reconnection."""
        buffer_len = self.buffer.size()
        if buffer_len == 0:
            return

        print(f"{COLOR_CYAN}[Buffer Flush] Flushing {buffer_len} offline telemetry items to Backend...{COLOR_RESET}")
        flushed_count = 0
        batch = self.buffer.dequeue_batch(batch_size=50)
        
        for item in batch:
            if self.send_telemetry_payload(item):
                flushed_count += 1
            else:
                # Re-queue failed item
                self.buffer.enqueue(item)
                self.is_online = False
                print(f"{COLOR_RED}[Buffer Flush] Re-connection lost during flush. Re-queued items.{COLOR_RESET}")
                return

        print(f"{COLOR_GREEN}[Buffer Flush Success] Successfully flushed {flushed_count} items. Remaining buffer: {self.buffer.size()}{COLOR_RESET}")

    def run(self):
        print(f"{COLOR_CYAN}===================================================={COLOR_RESET}")
        print(f"{COLOR_CYAN}    AR-IMMS DATA COLLECTOR AGENT DAEMON (psutil)    {COLOR_RESET}")
        print(f"{COLOR_CYAN}===================================================={COLOR_RESET}")
        print(f"Node ID:          {NODE_ID}")
        print(f"Hostname:         {self.collector.hostname}")
        print(f"IP / MAC:         {self.collector.ip_address} | {self.collector.mac_address}")
        print(f"OS System:        {self.collector.os_name} {self.collector.os_version}")
        print(f"Target Backend:   {BACKEND_URL}")
        print(f"Polling Interval: {COLLECT_INTERVAL} seconds")
        print(f"{COLOR_CYAN}----------------------------------------------------{COLOR_RESET}")

        while self.is_running:
            start_loop_time = time.time()
            
            # 1. Collect Telemetry Snapshot via psutil
            snapshot = self.collector.collect_all_telemetry(node_id=NODE_ID)
            metrics = snapshot["metrics"]
            
            # Formatted status output
            cpu_str = f"CPU: {metrics['cpu_usage_percent']}%"
            ram_str = f"RAM: {metrics['memory_usage_percent']}% ({metrics['memory_used_gb']}/{metrics['memory_total_gb']}GB)"
            disk_str = f"Disk: {metrics['disk_usage_percent']}%"
            temp_str = f"Temp: {metrics['temperature_celsius']}°C"
            net_str = f"Rx: {metrics['network_rx_kbps']} KB/s | Tx: {metrics['network_tx_kbps']} KB/s"

            # 2. Transmit or Buffer Payload
            success = self.send_telemetry_payload(snapshot)
            
            if success:
                if not self.is_online:
                    self.is_online = True
                    print(f"{COLOR_GREEN}[Network Status] Connection to Backend established.{COLOR_RESET}")
                
                # Flush offline buffer if any
                if not self.buffer.is_empty():
                    self.flush_buffered_telemetry()
                    
                status_label = f"{COLOR_GREEN}[ONLINE - SENT]{COLOR_RESET}"
            else:
                if self.is_online:
                    self.is_online = False
                    print(f"{COLOR_RED}[Network Status] Backend unreachable. Switching to offline buffer mode.{COLOR_RESET}")
                
                self.buffer.enqueue(snapshot)
                status_label = f"{COLOR_YELLOW}[OFFLINE - BUFFERED (Queue: {self.buffer.size()}/{MAX_BUFFER_SIZE})]{COLOR_RESET}"

            print(f"{status_label} {time.strftime('%H:%M:%S')} | {cpu_str} | {ram_str} | {disk_str} | {temp_str} | {net_str}")

            # Sleep remaining loop duration
            elapsed = time.time() - start_loop_time
            sleep_duration = max(COLLECT_INTERVAL - elapsed, 0.5)
            time.sleep(sleep_duration)

if __name__ == "__main__":
    daemon = CollectorAgentDaemon()
    daemon.run()
