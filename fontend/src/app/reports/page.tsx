"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Zap,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  TrendingDown,
  Info,
  CheckCircle2,
  PieChart as PieChartIcon,
  Server,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { apiRequest } from "@/lib/api";
import { exportToExcel, exportPueReportPdf } from "@/lib/exportUtils";
import { PueReportData } from "@/lib/types";

const ENERGY_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [pueData, setPueData] = useState<PueReportData | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const loadPueReport = async () => {
    setLoading(true);
    const res = await apiRequest<PueReportData>("/api/v1/reports/pue");
    if (res.success && res.data) {
      setPueData(res.data);
    } else {
      // Dữ liệu mẫu chuẩn Tier III nếu offline
      setPueData({
        pue: 1.34,
        status: "Hiệu quả cao (Tier III Chuẩn)",
        it_power_kw: 1.88,
        facility_power_kw: 0.64,
        total_power_kw: 2.52,
        breakdown: {
          it_equipment_percent: 74.6,
          cooling_system_percent: 18.2,
          power_distribution_loss_percent: 5.2,
          lighting_auxiliary_percent: 2.0,
        },
        racks_breakdown: [
          { rack_id: 1, rack_name: "Tủ Rack Server A01", total_power_watts: 810.0, node_count: 3 },
          { rack_id: 2, rack_name: "Tủ Rack Server A02", total_power_watts: 800.0, node_count: 2 },
          { rack_id: 3, rack_name: "Tủ Rack SAN Storage", total_power_watts: 310.0, node_count: 1 },
          { rack_id: 4, rack_name: "Tủ Rack Edge HCM-01", total_power_watts: 185.0, node_count: 1 },
        ],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPueReport();
  }, []);

  const data = pueData || {
    pue: 1.34,
    status: "Hiệu quả cao (Tier III Chuẩn)",
    it_power_kw: 1.88,
    facility_power_kw: 0.64,
    total_power_kw: 2.52,
    breakdown: {
      it_equipment_percent: 74.6,
      cooling_system_percent: 18.2,
      power_distribution_loss_percent: 5.2,
      lighting_auxiliary_percent: 2.0,
    },
    racks_breakdown: [],
  };

  const pieChartData = [
    { name: "Thiết bị IT (Máy chủ, SAN, Switch)", value: data.breakdown.it_equipment_percent },
    { name: "Hệ thống làm mát (HVAC / CRAC)", value: data.breakdown.cooling_system_percent },
    { name: "Tổn thất nguồn UPS & Biến áp", value: data.breakdown.power_distribution_loss_percent },
    { name: "Chiếu sáng & Phụ trợ", value: data.breakdown.lighting_auxiliary_percent },
  ];

  const barChartData = (data.racks_breakdown || []).map((r) => ({
    name: r.rack_name,
    power: Number((r.total_power_watts / 1000).toFixed(2)),
    nodes: r.node_count,
  }));

  // Xuất Excel
  const handleExportExcel = () => {
    setExporting("excel");
    const exportRows = (data.racks_breakdown || []).map((r, idx) => ({
      STT: idx + 1,
      "Tủ Rack": r.rack_name,
      "Công Suất (Watts)": r.total_power_watts,
      "Công Suất (kW)": Number((r.total_power_watts / 1000).toFixed(2)),
      "Số Máy Chủ (Nodes)": r.node_count,
      "Chỉ Số PUE Trung Tâm": data.pue,
      "Đánh Giá": data.status,
    }));

    exportToExcel(exportRows, `Bao_cao_PUE_AR-IMMS_${new Date().toISOString().slice(0, 10)}`);
    setTimeout(() => setExporting(null), 500);
  };

  // Xuất PDF
  const handleExportPdf = () => {
    setExporting("pdf");
    exportPueReportPdf({
      pue: data.pue,
      itPower: data.it_power_kw,
      facilityPower: data.facility_power_kw,
      totalPower: data.total_power_kw,
      statusText: data.status,
      racks: (data.racks_breakdown || []).map((r) => ({
        name: r.rack_name,
        power: r.total_power_watts,
        nodes: r.node_count,
      })),
    });
    setTimeout(() => setExporting(null), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar & Nút Xuất Báo Cáo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Báo Cáo Hiệu Quả Sử Dụng Năng Lượng (PUE Report & Energy Analytics)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân tích tỷ số hiệu quả năng lượng chuẩn quốc tế PUE và xuất báo cáo dữ liệu định dạng Excel / PDF
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting === "excel"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting === "excel" ? "Đang xuất..." : "Xuất File Excel"}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exporting === "pdf"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            <FileDown className="w-4 h-4" />
            {exporting === "pdf" ? "Đang tạo PDF..." : "Xuất Báo Cáo PDF"}
          </button>
        </div>
      </div>

      {/* 4 Thẻ Chỉ Số Năng Lượng Hàng Đầu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PUE Thẻ Chính */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-emerald-950/20 border border-emerald-500/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Chỉ Số PUE Hiện Tại
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-white">{data.pue.toFixed(2)}</span>
            <span className="text-xs font-bold text-emerald-400">Ratio</span>
          </div>
          <p className="text-[11px] text-emerald-300/80 font-medium mt-2">{data.status}</p>
        </div>

        {/* Công Suất IT Thiết Bị */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Công Suất Thiết Bị IT
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-indigo-400">{data.it_power_kw.toFixed(2)}</span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Máy chủ Server, SAN Storage, Switch Core</p>
        </div>

        {/* Công Suất Làm Mát & Phụ Tải */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Phụ Tải Làm Mát & UPS
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-cyan-400">{data.facility_power_kw.toFixed(2)}</span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Hệ thống CRAC In-Row, Chiller & Tổn hao</p>
        </div>

        {/* Tổng Công Suất Toàn Trung Tâm */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tổng Tải Toàn Cơ Sở
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-white">{data.total_power_kw.toFixed(2)}</span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Total Facility Power Consumption</p>
        </div>
      </div>

      {/* Đồ Thị: Phân Rã Năng Lượng (Donut) & Tiêu Thụ Theo Tủ Rack (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu Đồ Tròn Phân Bổ Năng Lượng */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              Cơ Cấu Phân Bổ Năng Lượng Toàn Cơ Sở (%)
            </h3>
            <span className="text-xs font-mono text-slate-400">100% Phụ Tải</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ENERGY_COLORS[index % ENERGY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value}%`, "Tỷ trọng"]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu Đồ Cột Công Suất Theo Tủ Rack */}
        <div className="p-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Công Suất Tiêu Thụ Theo Từng Tủ Rack (kW)
            </h3>
            <span className="text-xs font-mono text-slate-400">Rack Breakdown</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="power" fill="#6366f1" radius={[6, 6, 0, 0]} name="Công suất (kW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bảng Chi Tiết Phân Bổ Tủ Rack Để Đối Chiếu Dữ Liệu */}
      <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Bảng Số Liệu Chi Tiết Các Tủ Thiết Bị Trong Trung Tâm Dữ Liệu
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-y border-slate-800">
              <tr>
                <th className="py-3 px-3">Tủ Rack</th>
                <th className="py-3 px-3">Số Lượng Máy Chủ</th>
                <th className="py-3 px-3">Công Suất Tiêu Thụ (Watts)</th>
                <th className="py-3 px-3">Công Suất (kW)</th>
                <th className="py-3 px-3">Đánh Giá Phụ Tải</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(data.racks_breakdown || []).map((r) => (
                <tr key={r.rack_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-200">{r.rack_name}</td>
                  <td className="py-3 px-3 text-slate-300">{r.node_count} Nodes</td>
                  <td className="py-3 px-3 font-bold text-amber-400">{r.total_power_watts.toFixed(1)} W</td>
                  <td className="py-3 px-3 text-slate-300">{(r.total_power_watts / 1000).toFixed(2)} kW</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Bình thường
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
