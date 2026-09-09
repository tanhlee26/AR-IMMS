"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  AlertTriangle,
  ClipboardList,
  Zap,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Thermometer,
  HardDrive,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    const res = await apiRequest("/api/v1/dashboard");
    if (res.success && res.data) {
      setDashboardData(res.data);
    } else {
      // Dữ liệu fallback nếu chưa kết nối backend
      setDashboardData({
        summary: {
          total_nodes: 7,
          active_nodes: 6,
          warning_nodes: 1,
          critical_nodes: 1,
          avg_cpu: 48.5,
          max_temp: 84.5,
          pue: 1.34,
          active_alerts: 2,
        },
        nodes: [
          { id: 1, code: "SV-01", name: "Server Alpha 01 - DB Master", rack: "Rack A01", ip: "192.168.10.11", cpu: 24.5, ram: 42.0, temp: 41.5, power: 280, status: "healthy" },
          { id: 2, code: "SV-02", name: "Server Alpha 02 - Redis", rack: "Rack A01", ip: "192.168.10.12", cpu: 18.2, ram: 35.0, temp: 39.0, power: 190, status: "healthy" },
          { id: 3, code: "SV-03", name: "Server Alpha 03 - Gateway", rack: "Rack A01", ip: "192.168.10.13", cpu: 88.4, ram: 78.0, temp: 58.5, power: 340, status: "warning" },
          { id: 4, code: "SV-04", name: "Server Beta 01 - AI Chassis", rack: "Rack A02", ip: "192.168.10.21", cpu: 96.8, ram: 92.5, temp: 84.5, power: 580, status: "critical" },
        ],
        alerts: [
          { id: 1, code: "ALT-0001", severity: "Critical", source: "Server Beta 01", message: "Nhiệt độ CPU vượt ngưỡng khẩn cấp (>80°C)", time: "10:15 hôm nay", state: "Chưa xử lý" },
          { id: 2, code: "ALT-0002", severity: "Warning", source: "Server Alpha 03", message: "Mức tải CPU vượt ngưỡng cảnh báo (>85%)", time: "10:30 hôm nay", state: "Chưa xử lý" },
        ],
      });
    }
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const summary = dashboardData?.summary || {
    total_nodes: 7,
    active_nodes: 6,
    avg_cpu: 48.5,
    max_temp: 84.5,
    pue: 1.34,
    active_alerts: 2,
  };

  const nodes = dashboardData?.nodes || [];
  const alerts = dashboardData?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Trung Tâm Giám Sát Điều Hành Trực Tuyến</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng quan tài nguyên hạ tầng, hiệu năng máy chủ và chỉ số cảnh báo thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Cập nhật: <span className="text-slate-200 font-mono">{lastUpdated || "Đang tải..."}</span>
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* 4 Thẻ KPI Hàng Đầu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Máy Chủ Đang Chạy */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Máy Chủ Giám Sát</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{summary.total_nodes || 7}</span>
            <span className="text-xs font-medium text-emerald-400">Đang online: {summary.active_nodes || 6}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>2 Data Centers (Hòa Lạc & HCM)</span>
          </div>
        </div>

        {/* Cảnh Báo Đang Mở */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 relative overflow-hidden group hover:border-rose-900/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cảnh Báo Sự Cố (Alerts)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">{summary.active_alerts || 2}</span>
            <span className="text-xs font-medium text-rose-400/80">Cần xử lý ngay</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <Link href="/alerts-tickets" className="text-indigo-400 hover:underline flex items-center gap-1">
              Xem chi tiết cảnh báo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tải CPU Trung Bình */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tải CPU Trung Bình</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{summary.avg_cpu || 48.5}%</span>
            <span className="text-xs font-medium text-amber-400">Max Temp: {summary.max_temp || 84.5}°C</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
              style={{ width: `${Math.min(100, summary.avg_cpu || 50)}%` }}
            ></div>
          </div>
        </div>

        {/* Chỉ Số Năng Lượng PUE */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hiệu Quả Năng Lượng (PUE)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{summary.pue ? Number(summary.pue).toFixed(2) : "1.34"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tier III Chuẩn
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <Link href="/reports" className="text-indigo-400 hover:underline flex items-center gap-1">
              Phân tích PUE & Xuất file <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Khu vực trung tâm: Bảng Máy Chủ & Danh Sách Cảnh Báo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái: Trực Quan Trạng Thái Máy Chủ Server Nodes (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0f172a]/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Trạng Thái Cụm Máy Chủ Trọng Yếu</h3>
            </div>
            <Link
              href="/digital-twin"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Mở Cây Digital Twin <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-3">Máy Chủ / IP</th>
                  <th className="py-3 px-3">Tủ Rack</th>
                  <th className="py-3 px-3">CPU</th>
                  <th className="py-3 px-3">RAM</th>
                  <th className="py-3 px-3">Nhiệt Độ</th>
                  <th className="py-3 px-3">Công Suất</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {nodes.map((node: any) => (
                  <tr key={node.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-100">{node.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{node.ip}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300">{node.rack}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          node.cpu > 85 ? "text-rose-400" : node.cpu > 70 ? "text-amber-400" : "text-slate-300"
                        }`}
                      >
                        {node.cpu}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{node.ram}%</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          node.temp > 75 ? "text-rose-400" : node.temp > 60 ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {node.temp}°C
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{node.power} W</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          node.status === "critical"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : node.status === "warning"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {node.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột Phải: Cảnh Báo Sự Cố Mới Nhất (1 col) */}
        <div className="rounded-2xl bg-[#0f172a]/80 border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Cảnh Báo Trực Tuyến</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-mono font-bold">
                {alerts.length} Sự Cố
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  Không có cảnh báo hoạt động nào. Mọi máy chủ đều an toàn.
                </div>
              ) : (
                alerts.map((alt: any) => (
                  <div
                    key={alt.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                        {alt.severity}
                      </span>
                      <span className="text-[11px] text-slate-500">{alt.time}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">{alt.message}</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Nguồn: {alt.source}</span>
                      <span className="text-amber-400 font-medium">{alt.state}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/alerts-tickets"
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-center text-indigo-400 hover:text-indigo-300 border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            Quản Lý Toàn Bộ Alert & Ticket <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
