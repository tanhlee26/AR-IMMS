"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Building2,
  FolderTree,
  Server,
  ChevronRight,
  ChevronDown,
  Activity,
  Cpu,
  Thermometer,
  Zap,
  Box,
  QrCode,
  Search,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { SiteUnit, RoomUnit, RackUnit, ServerNode } from "@/lib/types";

export default function DigitalTwinPage() {
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<SiteUnit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<ServerNode | null>(null);

  // Trạng thái mở rộng của các node trong cây (Set chứa key)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const fetchTree = async () => {
    setLoading(true);
    const res = await apiRequest<SiteUnit[]>("/api/v1/hierarchy/tree");
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setTreeData(res.data);
      // Mặc định mở rộng toàn bộ Site và Room đầu tiên
      const initialKeys = new Set<string>();
      res.data.forEach((s) => {
        initialKeys.add(`site-${s.id}`);
        s.rooms?.forEach((r) => {
          initialKeys.add(`room-${r.id}`);
          r.racks?.forEach((rack) => {
            initialKeys.add(`rack-${rack.id}`);
          });
        });
      });
      setExpandedKeys(initialKeys);

      // Chọn server đầu tiên làm mặc định
      const firstServer = res.data[0]?.rooms?.[0]?.racks?.[0]?.nodes?.[0];
      if (firstServer && !selectedNode) {
        setSelectedNode(firstServer);
      }
    } else {
      // Fallback mock tree nếu API chưa nạp
      const fallbackTree: SiteUnit[] = [
        {
          id: 1,
          type: "site",
          name: "Trung Tâm Dữ Liệu Hòa Lạc (DC-HN-01)",
          code: "DC-HN-01",
          location: "Khu Công Nghệ Cao Hòa Lạc, Hà Nội",
          description: "Data Center Tier III chính",
          rooms: [
            {
              id: 1,
              type: "room",
              site_id: 1,
              name: "Phòng Máy Chủ A01",
              code: "ROOM-A01",
              floor: "Tầng 1",
              racks: [
                {
                  id: 1,
                  type: "rack",
                  room_id: 1,
                  name: "Tủ Rack Server A01",
                  code: "RACK-A01",
                  unit_capacity: 42,
                  total_power_capacity_watts: 5000,
                  nodes: [
                    {
                      id: 1,
                      type: "server",
                      rack_id: 1,
                      name: "Server Alpha 01 - DB Master",
                      hostname: "srv-alpha-01",
                      ip_address: "192.168.10.11",
                      mac_address: "00:1A:2B:3C:4D:01",
                      status: "ONLINE",
                      ui_status: "healthy",
                      rack_position_u: 1,
                      power_consumption_watts: 280,
                      telemetry: { cpu: 24.5, ram: 42.0, temp: 41.5, disk: 38.0, power: 280 },
                      containers: [
                        { id: 1, container_id: "c_pg_master", name: "postgresql-primary", image: "postgres:15", status: "RUNNING", cpu_usage_percent: 24.5, memory_usage_mb: 4096 },
                      ],
                      markers: [
                        { id: 1, marker_type: "ARUCO", marker_code: "ARUCO-4X4-11", spatial_coordinates: '{"x": 0.0, "y": 0.45, "z": 0.8}' },
                      ],
                    },
                    {
                      id: 3,
                      type: "server",
                      rack_id: 1,
                      name: "Server Alpha 03 - API Gateway",
                      hostname: "srv-alpha-03",
                      ip_address: "192.168.10.13",
                      mac_address: "00:1A:2B:3C:4D:03",
                      status: "WARNING",
                      ui_status: "warning",
                      rack_position_u: 5,
                      power_consumption_watts: 340,
                      telemetry: { cpu: 88.4, ram: 78.0, temp: 58.5, disk: 62.0, power: 340 },
                      containers: [
                        { id: 4, container_id: "c_kong", name: "kong-gateway", image: "kong:3.4", status: "RUNNING", cpu_usage_percent: 88.4, memory_usage_mb: 3200 },
                      ],
                      markers: [
                        { id: 2, marker_type: "ARUCO", marker_code: "ARUCO-4X4-13", spatial_coordinates: '{"x": 0.0, "y": 0.90, "z": 0.8}' },
                      ],
                    },
                  ],
                },
                {
                  id: 2,
                  type: "rack",
                  room_id: 1,
                  name: "Tủ Rack Server A02",
                  code: "RACK-A02",
                  unit_capacity: 42,
                  total_power_capacity_watts: 6000,
                  nodes: [
                    {
                      id: 4,
                      type: "server",
                      rack_id: 2,
                      name: "Server Beta 01 - AI Inference",
                      hostname: "srv-beta-01",
                      ip_address: "192.168.10.21",
                      mac_address: "00:1A:2B:3C:4D:04",
                      status: "CRITICAL",
                      ui_status: "critical",
                      rack_position_u: 1,
                      power_consumption_watts: 580,
                      telemetry: { cpu: 96.8, ram: 92.5, temp: 84.5, disk: 71.0, power: 580 },
                      containers: [
                        { id: 5, container_id: "c_triton", name: "triton-inference-server", image: "nvcr.io/triton:23.08", status: "RUNNING", cpu_usage_percent: 96.8, memory_usage_mb: 16384 },
                      ],
                      markers: [
                        { id: 3, marker_type: "ARUCO", marker_code: "ARUCO-4X4-21", spatial_coordinates: '{"x": 0.6, "y": 0.45, "z": 0.8}' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 2,
          type: "site",
          name: "Trung Tâm Dữ Liệu Quang Trung (DC-HCM-01)",
          code: "DC-HCM-01",
          location: "CVPM Quang Trung, Q.12, TP.HCM",
          description: "Data Center DR dự phòng",
          rooms: [
            {
              id: 3,
              type: "room",
              site_id: 2,
              name: "Phòng Server Edge HCM",
              code: "ROOM-HCM-01",
              floor: "Tầng Trệt",
              racks: [
                {
                  id: 4,
                  type: "rack",
                  room_id: 3,
                  name: "Tủ Rack Edge HCM-01",
                  code: "RACK-HCM-01",
                  unit_capacity: 42,
                  total_power_capacity_watts: 4000,
                  nodes: [
                    {
                      id: 7,
                      type: "server",
                      rack_id: 4,
                      name: "Server Edge HCM 01",
                      hostname: "srv-hcm-01",
                      ip_address: "10.20.1.11",
                      mac_address: "00:1A:2B:3C:4D:07",
                      status: "ONLINE",
                      ui_status: "healthy",
                      rack_position_u: 1,
                      power_consumption_watts: 185,
                      telemetry: { cpu: 15.2, ram: 28.0, temp: 36.5, disk: 22.0, power: 185 },
                      containers: [],
                      markers: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      setTreeData(fallbackTree);
      setSelectedNode(fallbackTree[0].rooms[0].racks[0].nodes[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleExpand = (key: string) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedKeys(next);
  };

  const getStatusDot = (status?: string) => {
    switch (status) {
      case "CRITICAL":
      case "critical":
        return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500"></span>;
      case "WARNING":
      case "warning":
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>;
      case "ONLINE":
      case "healthy":
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Cây Phân Cấp Hạ Tầng Digital Twin (Tree Explorer)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trực quan hóa cấu trúc thực thể đa cấp Site → Room → Rack → Server kết nối AR Markers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTree}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới cây
          </button>
        </div>
      </div>

      {/* Main Grid: Cây Phân Cấp Bên Trái & Bảng Chi Tiết Inspector Bên Phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Cây Phân Cấp Tree (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 flex flex-col">
          {/* Thanh tìm kiếm nhanh */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm máy chủ theo Tên, Hostname hoặc IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Tree View Container */}
          <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1">
            {treeData.map((site) => {
              const siteKey = `site-${site.id}`;
              const isSiteOpen = expandedKeys.has(siteKey);

              return (
                <div key={siteKey} className="rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
                  {/* Site Header */}
                  <div
                    onClick={() => toggleExpand(siteKey)}
                    className="p-3 bg-gradient-to-r from-slate-900 to-slate-900/40 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      {isSiteOpen ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">{site.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {site.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{site.rooms?.length || 0} Phòng Máy</span>
                  </div>

                  {/* Rooms List */}
                  {isSiteOpen && (
                    <div className="pl-6 pr-3 py-2 space-y-2 border-t border-slate-800/50">
                      {site.rooms?.map((room) => {
                        const roomKey = `room-${room.id}`;
                        const isRoomOpen = expandedKeys.has(roomKey);

                        return (
                          <div key={roomKey} className="rounded-lg bg-slate-950/40 border border-slate-800/60">
                            {/* Room Header */}
                            <div
                              onClick={() => toggleExpand(roomKey)}
                              className="p-2.5 hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition"
                            >
                              <div className="flex items-center gap-2">
                                {isRoomOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <FolderTree className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-semibold text-slate-200">{room.name}</span>
                                <span className="text-[10px] text-slate-500">({room.floor})</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {room.racks?.length || 0} Racks
                              </span>
                            </div>

                            {/* Racks List */}
                            {isRoomOpen && (
                              <div className="pl-6 pr-2 py-1.5 space-y-2 border-t border-slate-800/40">
                                {room.racks?.map((rack) => {
                                  const rackKey = `rack-${rack.id}`;
                                  const isRackOpen = expandedKeys.has(rackKey);

                                  return (
                                    <div
                                      key={rackKey}
                                      className="rounded-lg bg-slate-900/40 border border-slate-800/50"
                                    >
                                      {/* Rack Header */}
                                      <div
                                        onClick={() => toggleExpand(rackKey)}
                                        className="p-2 hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isRackOpen ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                          )}
                                          <Box className="w-3.5 h-3.5 text-amber-400" />
                                          <span className="text-xs font-medium text-slate-200">{rack.name}</span>
                                          <span className="text-[10px] font-mono text-slate-500">
                                            [{rack.unit_capacity}U]
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {rack.nodes?.length || 0} Servers
                                        </span>
                                      </div>

                                      {/* Servers List inside Rack */}
                                      {isRackOpen && (
                                        <div className="pl-6 pr-2 py-1 space-y-1 border-t border-slate-800/30">
                                          {rack.nodes
                                            ?.filter(
                                              (n) =>
                                                !searchQuery ||
                                                n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                n.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                n.ip_address.includes(searchQuery)
                                            )
                                            .map((node) => {
                                              const isSelected = selectedNode?.id === node.id;
                                              return (
                                                <div
                                                  key={node.id}
                                                  onClick={() => setSelectedNode(node)}
                                                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                                                    isSelected
                                                      ? "bg-indigo-600/20 border border-indigo-500/50 text-white"
                                                      : "hover:bg-slate-800/50 text-slate-300"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2.5">
                                                    {getStatusDot(node.status)}
                                                    <Server className="w-3.5 h-3.5 text-slate-400" />
                                                    <div className="text-xs font-medium">
                                                      <span>{node.name}</span>
                                                      <span className="text-[10px] text-slate-500 font-mono ml-2">
                                                        U{node.rack_position_u} • {node.ip_address}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                      CPU {node.telemetry?.cpu}%
                                                    </span>
                                                    <span className="text-[10px] font-mono text-amber-400">
                                                      {node.telemetry?.temp}°C
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột Chi Tiết Máy Chủ Inspector (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-5">
              {/* Header của Server */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    ID: SV-{selectedNode.id.toString().padStart(2, "0")}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      selectedNode.status === "CRITICAL"
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        : selectedNode.status === "WARNING"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {selectedNode.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedNode.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Hostname: {selectedNode.hostname}</p>
              </div>

              {/* Thông số phần cứng & Mạng */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  1. Thông Số Hạ Tầng Vật Lý
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[11px] block">Địa chỉ IP</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedNode.ip_address}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[11px] block">Vị Trí Rack Unit</span>
                    <span className="font-mono font-semibold text-indigo-400">U{selectedNode.rack_position_u} (Slot)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[11px] block">Công Suất Tiêu Thụ</span>
                    <span className="font-mono font-semibold text-amber-400">
                      {selectedNode.power_consumption_watts} Watts
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[11px] block">MAC Address</span>
                    <span className="font-mono text-xs text-slate-400">
                      {selectedNode.mac_address || "00:1A:2B:3C:4D:01"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Telemetry Realtime Metrics */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  2. Thông Số Đo Đạc Telemetry
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <Cpu className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase">CPU Usage</span>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {selectedNode.telemetry?.cpu || 0}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <Activity className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase">RAM Usage</span>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {selectedNode.telemetry?.ram || 0}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <Thermometer className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase">Nhiệt Độ</span>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {selectedNode.telemetry?.temp || 0}°C
                    </div>
                  </div>
                </div>
              </div>

              {/* Docker Workload Containers */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>3. Workload Docker Containers</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedNode.containers?.length || 0} Containers
                  </span>
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedNode.containers && selectedNode.containers.length > 0 ? (
                    selectedNode.containers.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{c.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{c.image}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            {c.status}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            CPU: {c.cpu_usage_percent}% • RAM: {c.memory_usage_mb}MB
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-500 text-center text-xs">
                      Không có container nào đang chạy trên máy chủ này
                    </div>
                  )}
                </div>
              </div>

              {/* AR Marker & Không Gian */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>4. Định Danh Không Gian Thực Tế Ảo (AR Marker)</span>
                  <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                </h4>
                {selectedNode.markers && selectedNode.markers.length > 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-indigo-300">
                        {selectedNode.markers[0].marker_code}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tọa độ không gian 3D:{" "}
                        <span className="font-mono text-slate-300">
                          {selectedNode.markers[0].spatial_coordinates || "(0.0, 0.45, 0.8)"}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                      {selectedNode.markers[0].marker_type}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-500 text-center text-xs">
                    Chưa gán tem AR Marker cho máy chủ này
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Chọn một máy chủ từ cây bên trái để xem thông tin chi tiết
            </div>
          )}

          {/* Quick Action Link */}
          {selectedNode && (
            <Link
              href={`/telemetry?node_id=${selectedNode.id}`}
              className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              Mở Đồ Thị Telemetry Trực Tiếp Server Này <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
