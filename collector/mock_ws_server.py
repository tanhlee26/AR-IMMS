import asyncio
import json
import websockets

# Server gia lap, dung de Dev 2 test Client truoc khi Backend That (Dev 1) xong TSK-201.
# Chi in ra du lieu nhan duoc, khong luu CSDL, khong xac thuc.

HOST = "0.0.0.0"
PORT = 8765


async def handle_client(websocket):
    print(f"[SERVER] Client moi ket noi: {websocket.remote_address}")
    try:
        async for message in websocket:
            data = json.loads(message)
            node_id = data.get("node_id", "unknown")
            system = data.get("system", {})
            print(f"[SERVER] Nhan tu {node_id}: CPU={system.get('cpu_percent')}% "
                  f"RAM={system.get('ram_percent')}% Disk={system.get('disk_percent')}%")
    except websockets.exceptions.ConnectionClosed:
        print(f"[SERVER] Client ngat ket noi: {websocket.remote_address}")


async def main():
    print(f"Mock WebSocket Server dang chay tai ws://localhost:{PORT}")
    print("Nhan Ctrl+C de dung.\n")
    async with websockets.serve(handle_client, HOST, PORT):
        await asyncio.Future()  # chay mai mai


if __name__ == "__main__":
    asyncio.run(main())
