"""
AI Metrics Tracker — In-memory telemetry for AI API calls.
No database/model changes required. Resets on server restart.
"""
import time
import threading
from datetime import date, datetime
from typing import Dict, Any


class AIMetricsTracker:
    """Thread-safe singleton that records every Gemini API call."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._data_lock = threading.Lock()
        self._reset()

    # ── internal ──────────────────────────────────────────────────
    def _reset(self):
        self._today: date = date.today()
        self._calls_today: int = 0
        self._successes_today: int = 0
        self._failures_today: int = 0
        self._response_times: list[float] = []     # seconds
        self._total_calls_all_time: int = 0
        self._total_successes_all_time: int = 0

    def _maybe_rotate_day(self):
        """Auto-reset daily counters at midnight."""
        if date.today() != self._today:
            # Keep all-time stats, reset daily
            self._today = date.today()
            self._calls_today = 0
            self._successes_today = 0
            self._failures_today = 0
            self._response_times = []

    # ── public API ────────────────────────────────────────────────
    def record_call(self, success: bool, response_time: float):
        """Record a single AI API call result."""
        with self._data_lock:
            self._maybe_rotate_day()
            self._calls_today += 1
            self._total_calls_all_time += 1
            self._response_times.append(response_time)
            if success:
                self._successes_today += 1
                self._total_successes_all_time += 1
            else:
                self._failures_today += 1

    def get_metrics(self) -> Dict[str, Any]:
        """Return current metrics snapshot."""
        with self._data_lock:
            self._maybe_rotate_day()
            avg_time = (
                sum(self._response_times) / len(self._response_times)
                if self._response_times
                else 0.0
            )
            total_today = self._calls_today or 1  # avoid div-by-zero
            success_rate = (self._successes_today / total_today) * 100

            return {
                "calls_today": self._calls_today,
                "successes_today": self._successes_today,
                "failures_today": self._failures_today,
                "success_rate": round(success_rate, 1),
                "avg_response_time": round(avg_time, 2),
                "total_calls_all_time": self._total_calls_all_time,
            }


# Module-level singleton
ai_metrics = AIMetricsTracker()


# ── Helper context manager ────────────────────────────────────────
class track_ai_call:
    """
    Context manager to wrap any Gemini API call.

    Usage:
        with track_ai_call():
            response = client.models.generate_content(...)
    """

    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = time.perf_counter() - self._start
        success = exc_type is None
        ai_metrics.record_call(success=success, response_time=elapsed)
        return False  # don't suppress exceptions
