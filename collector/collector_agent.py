import time
import json
import psutil

try:
    import docker
    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False

INTERVAL_SEC = 5  # theo mo ta task: gui du lieu ve backend moi 5s/lan


def collect_system_stats():
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    return {
        "cpu_percent": cpu,
        "ram_percent": mem.percent,
        "ram_used_gb": round(mem.used / (1024 ** 3), 2),
        "ram_total_gb": round(mem.total / (1024 ** 3), 2),
        "disk_percent": disk.percent,
        "net_sent_mb": round(net.bytes_sent / (1024 ** 2), 2),
        "net_recv_mb": round(net.bytes_recv / (1024 ** 2), 2),
    }


def collect_docker_stats():
    if not DOCKER_AVAILABLE:
        return []

    try:
        client = docker.from_env()
    except Exception:
        # Docker khong chay hoac khong co quyen truy cap docker.sock
        return []

    containers_stats = []
    for container in client.containers.list():
        try:
            stats = container.stats(stream=False)
            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                stats["precpu_stats"]["cpu_usage"]["total_usage"]
            system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                stats["precpu_stats"]["system_cpu_usage"]
            cpu_pct = (cpu_delta / system_delta) * 100 if system_delta > 0 else 0

            mem_usage = stats["memory_stats"].get("usage", 0)
            mem_limit = stats["memory_stats"].get("limit", 1)

            containers_stats.append({
                "container_id": container.short_id,
                "name": container.name,
                "status": container.status,
                "cpu_percent": round(cpu_pct, 2),
                "mem_percent": round(mem_usage / mem_limit * 100, 2),
            })
        except Exception as e:
            print(f"[WARN] Khong lay duoc stats cho container {container.name}: {e}")

    return containers_stats


def build_payload(node_id="NODE-01"):
    return {
        "node_id": node_id,
        "timestamp": time.time(),
        "system": collect_system_stats(),
        "containers": collect_docker_stats(),
    }


def main():
    node_id = "NODE-01"  # doi theo dung node_id cua may nay (khop voi QR/ArUco da gan)
    print(f"Collector Agent dang chay cho {node_id}, gui du lieu moi {INTERVAL_SEC}s. Nhan Ctrl+C de dung.\n")

    while True:
        payload = build_payload(node_id)
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print("-" * 50)
        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()
