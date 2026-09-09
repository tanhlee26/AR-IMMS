"use client";

import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, XCircle, RefreshCw, Server, Database, Wifi } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface ConnectionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectionStatusModal({ isOpen, onClose }: ConnectionStatusModalProps) {
  const [checking, setChecking] = useState(false);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const testConnection = async () => {
    setChecking(true);
    const start = performance.now();
    try {
      const healthRes = await apiRequest("/health");
      const duration = Math.round(performance.now() - start);
      setLatency(duration);

      if (healthRes.success) {
        setBackendHealth(healthRes.data);
      } else {
        setBackendHealth({ status: "error", error: healthRes.error });
      }

      // Kiểm tra API Digital Twin Tree
      const treeRes = await apiRequest("/api/v1/hierarchy/tree");
      if (treeRes.success) {
        setHierarchyData(treeRes.data);
      }
    } catch (e: any) {
      setBackendHealth({ status: "disconnected", error: e.message });
    } finally {
      setChecking(false);
      setLastChecked(new Date().toLocaleTimeString("vi-VN"));
    }
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHealthy = backendHealth?.status === "healthy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-6 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kiểm Tra Kết Nối Frontend ↔ Backend</h3>
              <p className="text-xs text-slate-400">AR-IMMS Realtime Gateway Diagnostics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Trạng thái Tổng Quan */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isHealthy ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-500" />
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {isHealthy ? "Backend Đang Hoạt Động Ổn Định" : "Mất Kết Nối Hoặc Backend Đang Tắt"}
                </p>
                <p className="text-xs text-slate-400">
                  {isHealthy ? `Độ trễ phản hồi (Latency): ${latency} ms` : backendHealth?.error || "Vui lòng khởi chạy app.py"}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                isHealthy
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {isHealthy ? "Connected" : "Offline"}
            </span>
          </div>

          {/* Chi tiết từng thành phần */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <Server className="w-4 h-4 text-indigo-400" /> API Gateway Endpoint
              </span>
              <span className="font-mono text-xs text-indigo-300">http://127.0.0.1:5000</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <Database className="w-4 h-4 text-cyan-400" /> Digital Twin Sites
              </span>
              <span className="font-semibold text-slate-100">
                {Array.isArray(hierarchyData) ? `${hierarchyData.length} Trung Tâm Dữ Liệu` : "Đang kiểm tra..."}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <Wifi className="w-4 h-4 text-amber-400" /> WebSocket Gateway
              </span>
              <span className="text-xs font-medium text-emerald-400">ws://127.0.0.1:5000/socket.io/</span>
            </div>
          </div>

          {lastChecked && (
            <p className="text-[11px] text-center text-slate-500">
              Lần kiểm tra gần nhất: <span className="text-slate-400">{lastChecked}</span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={testConnection}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Đang Kiểm Tra..." : "Kiểm Tra Lại"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
