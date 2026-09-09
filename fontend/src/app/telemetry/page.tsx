"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Cpu,
  Thermometer,
  Zap,
  HardDrive,
  RefreshCw,
  Clock,
  Server,
  AlertTriangle,
  Play,
  Pause,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { apiRequest } from "@/lib/api";

const MOCK_SERVERS = [
  { id: 1, name: "Server Alpha 01 - DB Master", ip: "192.168.10.11", rack: "Rack A01" },
  { id: 2, name: "Server Alpha 02 - Redis Cache", ip: "192.168.10.12", rack: "Rack A01" },
  { id: 3, name: "Server Alpha 03 - API Gateway", ip: "192.168.10.13", rack: "Rack A01" },
  { id: 4, name: "Server Beta 01 - AI Inference", ip: "192.168.10.21", rack: "Rack A02" },
  { id: 5, name: "Server Beta 02 - Microservices", ip: "192.168.10.22", rack: "Rack A02" },
  { id: 6, name: "Server Storage 01 - SAN Node", ip: "192.168.10.31", rack: "Rack SAN-01" },
  { id: 7, name: "Server Edge HCM 01", ip: "10.20.1.11", rack: "Rack HCM-01" },
];

function TelemetryContent() {
  const searchParams = useSearchParams();
  const initialNodeId = Number(searchParams.get("node_id")) || 3;

  const [selectedNodeId, setSelectedNodeId] = useState<number>(initialNodeId);
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("1h");
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestMetric, setLatestMetric] = useState({
    cpu: 88.4,
    ram: 78.0,
    temp: 58.5,
    power: 340,
    disk: 62.0,
  });

  // Tải dữ liệu lịch sử và realtime
  const loadTelemetryData = async (nodeId: number) => {
    setLoading(true);

    // 1. Lấy thông số thời gian thực hiện tại
    const realRes = await apiRequest(`/api/v1/nodes/${nodeId}/telemetry/realtime`);
    if (realRes.success && realRes.data?.metrics) {
      const m = realRes.data.metrics;
      setLatestMetric({
        cpu: m.cpu_usage_percent || 0,
        ram: m.memory_usage_percent || 0,
        temp: m.temperature_celsius || 0,
        power: m.power_consumption_watts || 150,
        disk: m.disk_usage_percent || 40,
      });
    }

    // 2. Lấy chuỗi lịch sử CPU để vẽ đồ thị
    const hours = timeRange === "1h" ? 1 : timeRange === "6h" ? 6 : 24;
    const histRes = await apiRequest(
      `/api/v1/nodes/${nodeId}/telemetry/history?metric_type=cpu_usage_percent&hours=${hours}`
    );

    if (histRes.success && Array.isArray(histRes.data?.data_points) && histRes.data.data_points.length > 0) {
      const points = histRes.data.data_points.map((p: any) => {
        const timeStr = p.timestamp ? p.timestamp.slice(11, 19) : "00:00:00";
        // Giả lập đồng bộ RAM và Temp cùng timestamp nếu chưa có API join
        const baseCpu = p.value;
        const simulatedRam = Math.min(98, Math.max(15, baseCpu * 0.85 + (Math.sin(p.id || 1) * 5)));
        const simulatedTemp = Math.min(95, Math.max(30, 40 + baseCpu * 0.45));
        const simulatedPower = Math.round(180 + baseCpu * 2.2);

        return {
          time: timeStr,
          cpu: Number(baseCpu.toFixed(1)),
          ram: Number(simulatedRam.toFixed(1)),
          temp: Number(simulatedTemp.toFixed(1)),
          power: simulatedPower,
        };
      });
      setChartData(points);
    } else {
      // Dữ liệu mẫu sinh động nếu chưa có điểm lịch sử
      const samplePoints: any[] = [];
      const now = new Date();
      const count = timeRange === "1h" ? 20 : timeRange === "6h" ? 30 : 40;
      const baseCpu = nodeId === 4 ? 92 : nodeId === 3 ? 85 : 25;

      for (let i = count; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 60000 * (timeRange === "1h" ? 3 : 15));
        const noise = Math.sin(i * 0.5) * 6 + (Math.random() * 4 - 2);
        const cpu = Math.min(100, Math.max(5, baseCpu + noise));
        const ram = Math.min(100, Math.max(10, cpu * 0.8 + 10));
        const temp = Math.min(95, Math.max(30, 38 + cpu * 0.45));
        const power = Math.round(180 + cpu * 2.5);

        samplePoints.push({
          time: t.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          cpu: Number(cpu.toFixed(1)),
          ram: Number(ram.toFixed(1)),
          temp: Number(temp.toFixed(1)),
          power,
        });
      }
      setChartData(samplePoints);
      const last = samplePoints[samplePoints.length - 1];
      setLatestMetric({
        cpu: last.cpu,
        ram: last.ram,
        temp: last.temp,
        power: last.power,
        disk: 55.4,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTelemetryData(selectedNodeId);
  }, [selectedNodeId, timeRange]);

  // Vòng lặp Live Streaming 3 giây một lần để đẩy điểm mới vào biểu đồ
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setChartData((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const now = new Date();
        const noise = (Math.random() - 0.48) * 3;
        const newCpu = Math.min(100, Math.max(10, Number((last.cpu + noise).toFixed(1))));
        const newRam = Math.min(100, Math.max(15, Number((last.ram + noise * 0.4).toFixed(1))));
        const newTemp = Math.min(98, Math.max(30, Number((last.temp + noise * 0.2).toFixed(1))));
        const newPower = Math.round(180 + newCpu * 2.5);

        const newPoint = {
          time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          cpu: newCpu,
          ram: newRam,
          temp: newTemp,
          power: newPower,
        };

        setLatestMetric((m) => ({
          ...m,
          cpu: newCpu,
          ram: newRam,
          temp: newTemp,
          power: newPower,
        }));

        // Giữ lại 30 điểm mới nhất
        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const currentServer = MOCK_SERVERS.find((s) => s.id === selectedNodeId) || MOCK_SERVERS[0];

  return (
    <div className="space-y-6">
      {/* Header Điều Khiển Biểu Đồ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <span>Biểu Đồ Telemetry Thời Gian Thực (Hardware Performance)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                isLiveStreaming
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveStreaming ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`}></span>
              {isLiveStreaming ? "LIVE STREAM" : "PAUSED"}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diễn biến chuỗi thời gian tải CPU, RAM, Nhiệt độ và Công suất kết hợp ngưỡng cảnh báo Warning/Critical
          </p>
        </div>

        {/* Bộ lọc Máy chủ & Thời gian */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn máy chủ */}
          <div className="relative">
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(Number(e.target.value))}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              {MOCK_SERVERS.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.ip})
                </option>
              ))}
            </select>
          </div>

          {/* Khoảng thời gian */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            {(["1h", "6h", "24h"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  timeRange === range
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Toggle Live Stream */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`p-2 rounded-xl border transition ${
              isLiveStreaming
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title={isLiveStreaming ? "Tạm dừng live stream" : "Tiếp tục live stream"}
          >
            {isLiveStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4 Thẻ Đo Lường Tức Thời (Realtime Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Metric Card */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tải CPU</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{latestMetric.cpu}%</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                latestMetric.cpu > 85 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {latestMetric.cpu > 85 ? "HIGH LOAD" : "NORMAL"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Ngưỡng cảnh báo: Warning 80% • Critical 90%</p>
        </div>

        {/* RAM Metric Card */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bộ Nhớ RAM</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{latestMetric.ram}%</span>
            <span className="text-[10px] text-slate-400 font-mono">DDR4 ECC</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Ngưỡng cảnh báo: Warning 85% • Critical 92%</p>
        </div>

        {/* Nhiệt Độ Server */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhiệt Độ CPU</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                latestMetric.temp > 75 ? "text-rose-400" : latestMetric.temp > 60 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {latestMetric.temp}°C
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Thermal Zone 0</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Ngưỡng cảnh báo: Warning 65°C • Critical 80°C</p>
        </div>

        {/* Công Suất Tiêu Thụ */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Công Suất Điện</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-amber-400">{latestMetric.power} W</span>
            <span className="text-[10px] text-slate-400 font-mono">{(latestMetric.power / 1000).toFixed(2)} kW</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Nguồn kép dự phòng Redundant PSU</p>
        </div>
      </div>

      {/* Đồ Thị 1: Diễn Biến CPU & RAM Kết Hợp Ngưỡng Cảnh Báo */}
      <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Đồ Thị Tải CPU & Sử Dụng Bộ Nhớ RAM (%)
            </h3>
            <p className="text-xs text-slate-400">Đường đứt nét đỏ biểu thị ngưỡng Critical (90%), cam biểu thị Warning (80%)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-0.5 bg-cyan-400"></span> CPU Usage
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-3 h-0.5 bg-indigo-400"></span> RAM Usage
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              {/* Ngưỡng Critical 90% */}
              <ReferenceLine y={90} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "Critical (90%)", fill: "#f43f5e", fontSize: 10 }} />
              {/* Ngưỡng Warning 80% */}
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Warning (80%)", fill: "#f59e0b", fontSize: 10 }} />

              <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" name="CPU Usage (%)" />
              <Area type="monotone" dataKey="ram" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#ramGradient)" name="RAM Usage (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Đồ Thị 2: Diễn Biến Nhiệt Độ & Công Suất Tiêu Thụ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nhiệt Độ Máy Chủ */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-400" />
              Diễn Biến Nhiệt Độ Bo Mạch (°C)
            </h3>
            <span className="text-xs text-rose-400 font-mono">Critical: 80°C</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[25, 100]} tickLine={false} unit="°C" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="4 4" />
                <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2.5} dot={false} name="Nhiệt độ (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Công Suất Điện Tiêu Thụ */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Diễn Biến Công Suất Tiêu Thụ (Watts)
            </h3>
            <span className="text-xs text-amber-400 font-mono">Max PSU: 750W</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[100, 700]} tickLine={false} unit="W" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Công suất (Watts)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TelemetryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Đang tải luồng dữ liệu Telemetry...</div>}>
      <TelemetryContent />
    </Suspense>
  );
}
