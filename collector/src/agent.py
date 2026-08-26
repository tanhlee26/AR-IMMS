"""
AR-IMMS Data Collector Agent
Automated telemetry gathering daemon for infrastructure nodes.
"""
import os
import time
import psutil

def collect_system_metrics():
    return {
        "cpu_usage_percent": psutil.cpu_percent(interval=1),
        "memory_usage_percent": psutil.virtual_memory().percent,
        "disk_usage_percent": psutil.disk_usage('/').percent,
        "timestamp": time.time()
    }

def main():
    print("[AR-IMMS Collector Agent] Starting monitoring loop (Interval: 5s)...")
    while True:
        metrics = collect_system_metrics()
        print(f"[Telemetry] CPU: {metrics['cpu_usage_percent']}% | RAM: {metrics['memory_usage_percent']}% | Disk: {metrics['disk_usage_percent']}%")
        time.sleep(5)

if __name__ == "__main__":
    main()

