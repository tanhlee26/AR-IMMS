"""
AR-IMMS Collector Agent - System Metrics Collector Module
Utilizes psutil and system APIs to gather hardware, OS, network, and container telemetry.
"""
import os
import time
import socket
import platform
import uuid
import psutil
from typing import Dict, Any, List, Optional

class SystemMetricsCollector:
    def __init__(self):
        self.hostname = socket.gethostname()
        self.os_name = platform.system()
        self.os_version = platform.release()
        self.mac_address = self._get_mac_address()
        self.ip_address = self._get_ip_address()

        # Previous network counters for rate calculation (Rx/Tx KB/s)
        self._last_net_io = psutil.net_io_counters()
        self._last_time = time.time()

    def _get_mac_address(self) -> str:
        try:
            mac_num = uuid.getnode()
            mac_str = ':'.join(('%012X' % mac_num)[i:i+2] for i in range(0, 12, 2))
            return mac_str
        except Exception:
            return "00:00:00:00:00:00"

    def _get_ip_address(self) -> str:
        try:
            # Connect to dummy remote to determine primary outbound IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.5)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            try:
                return socket.gethostbyname(self.hostname)
            except Exception:
                return "127.0.0.1"

    def get_cpu_temperature(self, current_cpu_usage: float) -> float:
        """
        Retrieves CPU Temperature °C via psutil sensors.
        Falls back to thermal estimation model if hardware sensor is unavailable.
        """
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        for entry in entries:
                            if entry.current and entry.current > 0:
                                return round(entry.current, 1)
        except Exception:
            pass

        # Fallback Thermal Model for Mini Data Center Laptop Testbed:
        # Base ambient temp 42.0°C + CPU load factor
        estimated_temp = 42.0 + (current_cpu_usage * 0.42)
        return round(min(estimated_temp, 98.0), 1)

    def get_network_rates(self) -> Dict[str, float]:
        """Calculates Rx and Tx network transfer rates in KB/s."""
        current_time = time.time()
        current_net_io = psutil.net_io_counters()
        time_delta = max(current_time - self._last_time, 0.1)

        bytes_sent_delta = current_net_io.bytes_sent - self._last_net_io.bytes_sent
        bytes_recv_delta = current_net_io.bytes_recv - self._last_net_io.bytes_recv

        tx_kbps = round((bytes_sent_delta / 1024.0) / time_delta, 2)
        rx_kbps = round((bytes_recv_delta / 1024.0) / time_delta, 2)

        self._last_net_io = current_net_io
        self._last_time = current_time

        return {
            "network_rx_kbps": max(rx_kbps, 0.0),
            "network_tx_kbps": max(tx_kbps, 0.0),
            "bytes_sent": current_net_io.bytes_sent,
            "bytes_recv": current_net_io.bytes_recv
        }

    def get_container_stats(self) -> List[Dict[str, Any]]:
        """Collects Docker container runtime stats if Docker daemon is available."""
        containers = []
        try:
            import docker
            client = docker.from_env()
            for container in client.containers.list(all=True):
                stats = {
                    "container_id": container.short_id,
                    "name": container.name,
                    "image": container.image.tags[0] if container.image.tags else str(container.image.id)[:12],
                    "status": container.status.upper()
                }
                containers.append(stats)
        except Exception:
            # Docker SDK not installed or daemon not running (Graceful fallback)
            pass
        return containers

    def collect_all_telemetry(self, node_id: int = 1) -> Dict[str, Any]:
        """Collects a complete telemetry snapshot for the node."""
        cpu_usage = psutil.cpu_percent(interval=0.5)
        cpu_per_core = psutil.cpu_percent(percpu=True)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        net_rates = self.get_network_rates()
        cpu_temp = self.get_cpu_temperature(cpu_usage)
        containers = self.get_container_stats()

        snapshot = {
            "node_id": node_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "timestamp_epoch": time.time(),
            "host_info": {
                "hostname": self.hostname,
                "ip_address": self.ip_address,
                "mac_address": self.mac_address,
                "os_name": self.os_name,
                "os_version": self.os_version,
                "cpu_cores_physical": psutil.cpu_count(logical=False) or 1,
                "cpu_cores_logical": psutil.cpu_count(logical=True) or 1
            },
            "metrics": {
                "cpu_usage_percent": round(cpu_usage, 1),
                "cpu_per_core": cpu_per_core,
                "temperature_celsius": cpu_temp,
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "memory_usage_percent": round(memory.percent, 1),
                "disk_total_gb": round(disk.total / (1024**3), 2),
                "disk_used_gb": round(disk.used / (1024**3), 2),
                "disk_usage_percent": round(disk.percent, 1),
                "network_rx_kbps": net_rates["network_rx_kbps"],
                "network_tx_kbps": net_rates["network_tx_kbps"]
            },
            "containers": containers
        }
        return snapshot
