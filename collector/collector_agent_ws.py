import time
import json
import ssl
import websocket
import psutil

try:
    import docker
    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False

# --- Cau hinh ---
NODE_ID = "NODE-01"           # doi theo dung node_id cua may nay
INTERVAL_SEC = 5
WS_URL = "ws://localhost:8765"  # test local voi mock_ws_server.py
# Khi Dev 1 xong backend that: doi thanh "wss://192.168.10.1:5001" (theo bang IP TC-52)

# --- Cau hinh mTLS (chi dung khi ket noi wss:// that, de trong khi test local) ---
USE_MTLS = False
CA_CERT = "certs/ca.crt"
CLIENT_CERT = "certs/agent-node1.crt"
CLIENT_KEY = "certs/agent-node1.key"

RECONNECT_DELAY_SEC = 5


def collect_system_stats():
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "cpu_percent": cpu,
        "ram_percent": mem.percent,
        "disk_percent": disk.percent,
    }


def collect_docker_stats():
    if not DOCKER_AVAILABLE:
        return []
    try:
        client = docker.from_env()
        return [{"name": c.name, "status": c.status} for c in client.containers.list()]
    except Exception:
        return []


def build_payload():
    return {
        "node_id": NODE_ID,
        "timestamp": time.time(),
        "system": collect_system_stats(),
        "containers": collect_docker_stats(),
    }


def get_sslopt():
    if not USE_MTLS:
        return None
    return {
        "cert_reqs": ssl.CERT_REQUIRED,
        "ca_certs": CA_CERT,
        "certfile": CLIENT_CERT,
        "keyfile": CLIENT_KEY,
    }


def run_agent():
    while True:
        try:
            print(f"[AGENT] Dang ket noi toi {WS_URL} ...")
            sslopt = get_sslopt()
            ws = websocket.create_connection(WS_URL, sslopt=sslopt) if sslopt \
                else websocket.create_connection(WS_URL)
            print("[AGENT] Da ket noi. Bat dau gui du lieu.\n")

            while True:
                payload = build_payload()
                ws.send(json.dumps(payload))
                print(f"[AGENT] Da gui: CPU={payload['system']['cpu_percent']}% "
                      f"RAM={payload['system']['ram_percent']}%")
                time.sleep(INTERVAL_SEC)

        except (ConnectionRefusedError, websocket.WebSocketException, OSError) as e:
            print(f"[AGENT] Loi ket noi: {e}")
            print(f"[AGENT] Thu lai sau {RECONNECT_DELAY_SEC}s...\n")
            time.sleep(RECONNECT_DELAY_SEC)
        except KeyboardInterrupt:
            print("\n[AGENT] Dung boi nguoi dung.")
            break


if __name__ == "__main__":
    run_agent()
