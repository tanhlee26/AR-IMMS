"""
AR-IMMS Collector Agent - Resilient Telemetry Buffer Queue
Handles offline buffering up to 1000 items (BR-05 & NFR-REL-01).
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
        """Adds a telemetry payload to the buffer queue."""
        with self._lock:
            self._queue.append(telemetry)

    def dequeue(self) -> Optional[Dict[str, Any]]:
        """Pops the oldest telemetry payload from the queue."""
        with self._lock:
            if self._queue:
                return self._queue.popleft()
            return None

    def dequeue_batch(self, batch_size: int = 50) -> List[Dict[str, Any]]:
        """Pops a batch of telemetry payloads from the queue."""
        items = []
        with self._lock:
            while self._queue and len(items) < batch_size:
                items.append(self._queue.popleft())
        return items

    def size(self) -> int:
        with self._lock:
            return len(self._queue)

    def is_empty(self) -> bool:
        with self._lock:
            return len(self._queue) == 0

