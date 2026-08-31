"""
AR-IMMS Collector Agent - Hàng đợi Bộ nhớ đệm Dữ liệu Offline
Quản lý việc lưu trữ bộ nhớ đệm lên tới 1.000 bản ghi khi bị ngắt mạng (Tuân thủ BR-05 & NFR-REL-01).
"""
import collections
import threading
from typing import Dict, Any, List, Optional

class TelemetryBufferQueue:
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._queue = collections.deque(maxlen=max_size)
        self._lock = threading.Lock()

    def enqueue(self, telemetry: Dict[str, Any]):
        """Thêm một bản tin telemetry vào hàng đợi bộ nhớ đệm."""
        with self._lock:
            self._queue.append(telemetry)

    def dequeue(self) -> Optional[Dict[str, Any]]:
        """Lấy bản tin telemetry cũ nhất ra khỏi hàng đợi."""
        with self._lock:
            if self._queue:
                return self._queue.popleft()
            return None

    def dequeue_batch(self, batch_size: int = 50) -> List[Dict[str, Any]]:
        """Lấy một lô (batch) các bản tin telemetry ra khỏi hàng đợi."""
        items = []
        with self._lock:
            while self._queue and len(items) < batch_size:
                items.append(self._queue.popleft())
        return items

    def size(self) -> int:
        """Trả về số lượng bản tin hiện có trong hàng đợi đệm."""
        with self._lock:
            return len(self._queue)

    def is_empty(self) -> bool:
        """Kiểm tra hàng đợi đệm có đang rỗng hay không."""
        with self._lock:
            return len(self._queue) == 0
