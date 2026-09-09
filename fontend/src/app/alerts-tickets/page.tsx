"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  UserPlus,
  PlusCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Tag,
  Kanban,
  Table as TableIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { AlertItem, TicketItem } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function AlertsTicketsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"alerts" | "tickets">("alerts");
  const [ticketViewMode, setTicketViewMode] = useState<"table" | "kanban">("kanban");

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<TicketItem | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number>(3);

  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    node_id: 3,
    title: "",
    description: "",
    priority: "HIGH",
    alert_id: null as number | null,
  });

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedTicketForNotes, setSelectedTicketForNotes] = useState<TicketItem | null>(null);
  const [noteText, setNoteText] = useState("");

  const loadData = async () => {
    setLoading(true);
    const alertRes = await apiRequest<AlertItem[]>("/api/v1/alerts");
    if (alertRes.success && Array.isArray(alertRes.data)) {
      setAlerts(alertRes.data);
    }

    const ticketRes = await apiRequest<TicketItem[]>("/api/v1/tickets");
    if (ticketRes.success && Array.isArray(ticketRes.data)) {
      setTickets(ticketRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledgeAlert = async (alertId: number) => {
    await apiRequest(`/api/v1/alerts/${alertId}/acknowledge`, { method: "POST" });
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "ACKNOWLEDGED" } : a)));
  };

  const handleOpenCreateTicketFromAlert = (alert: AlertItem) => {
    setNewTicketData({
      node_id: alert.node_id,
      title: `[Xử lý ${alert.alert_type}] ${alert.message.slice(0, 60)}...`,
      description: `Cảnh báo ${alert.severity} kích hoạt: ${alert.message}. Giá trị: ${alert.metric_value || "N/A"}.`,
      priority: alert.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
      alert_id: alert.id,
    });
    setIsCreateTicketModalOpen(true);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest("/api/v1/tickets", {
      method: "POST",
      body: JSON.stringify(newTicketData),
    });
    setIsCreateTicketModalOpen(false);
    loadData();
  };

  const handleAssignSubmit = async () => {
    if (!selectedTicketForAssign) return;
    await apiRequest(`/api/v1/tickets/${selectedTicketForAssign.id}/assign`, {
      method: "POST",
      body: JSON.stringify({ assigned_to_user_id: selectedTechId }),
    });
    setIsAssignModalOpen(false);
    loadData();
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForNotes || !noteText.trim()) return;
    await apiRequest(`/api/v1/tickets/${selectedTicketForNotes.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note_text: noteText }),
    });
    setNoteText("");
    setIsNotesModalOpen(false);
    loadData();
  };

  const kanbanColumns: Array<{ status: TicketItem["status"]; label: string; color: string }> = [
    { status: "OPEN", label: "Mới Mở (OPEN)", color: "border-indigo-500/30 text-indigo-400" },
    { status: "IN_PROGRESS", label: "Đang Xử Lý (IN PROGRESS)", color: "border-cyan-500/30 text-cyan-400" },
    { status: "PENDING_CLOSURE", label: "Chờ Nghiệm Thu (PENDING CLOSURE)", color: "border-amber-500/30 text-amber-400" },
    { status: "CLOSED", label: "Đã Đóng (CLOSED)", color: "border-emerald-500/30 text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Quản Lý Cảnh Báo Sự Cố & Phiếu Bảo Trì</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tiếp nhận cảnh báo, phân công kỹ thuật viên hiện trường và theo dõi vòng đời ticket</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "alerts" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Cảnh Báo ({alerts.filter((a) => a.status === "OPEN").length})
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "tickets" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Phiếu Ticket ({tickets.length})
            </button>
          </div>
          <button onClick={loadData} disabled={loading} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {activeTab === "alerts" && (
        <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Danh Sách Cảnh Báo Thời Gian Thực (Active Alerts)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Tổng cộng: {alerts.length} cảnh báo</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-3">Mã / Node</th>
                  <th className="py-3 px-3">Mức Độ</th>
                  <th className="py-3 px-3">Nội Dung Cảnh Báo</th>
                  <th className="py-3 px-3">Đo Đạc</th>
                  <th className="py-3 px-3">Thời Điểm</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">ALT-{alert.id.toString().padStart(4, "0")} (Node #{alert.node_id})</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${alert.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200 max-w-sm">{alert.message}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">{alert.metric_value ?? "N/A"}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{alert.triggered_at ? alert.triggered_at.replace("T", " ").slice(0, 16) : "Vừa xong"}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${alert.status === "OPEN" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                        {alert.status === "OPEN" ? "Chưa xử lý" : "Đã xác nhận"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === "OPEN" && (
                          <button onClick={() => handleAcknowledgeAlert(alert.id)} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px]">
                            Xác Nhận (Ack)
                          </button>
                        )}
                        <button onClick={() => handleOpenCreateTicketFromAlert(alert)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] border border-slate-700">
                          Tạo Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setTicketViewMode("kanban")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${ticketViewMode === "kanban" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                <Kanban className="w-3.5 h-3.5" /> Kanban
              </button>
              <button onClick={() => setTicketViewMode("table")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${ticketViewMode === "table" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                <TableIcon className="w-3.5 h-3.5" /> Bảng Chi Tiết
              </button>
            </div>
            <button onClick={() => setIsCreateTicketModalOpen(true)} className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30">
              <PlusCircle className="w-4 h-4" /> Tạo Ticket Mới
            </button>
          </div>

          {ticketViewMode === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {kanbanColumns.map((col) => {
                const colTickets = tickets.filter((t) => t.status === col.status);
                return (
                  <div key={col.status} className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-4 flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold">{colTickets.length}</span>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                      {colTickets.map((t) => (
                        <div key={t.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-indigo-400">TCK-{t.id.toString().padStart(4, "0")}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${t.priority === "CRITICAL" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>{t.priority}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-2">{t.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Tech: <span className="text-slate-300">{t.assigned_to_user_id ? "Kỹ thuật viên #" + t.assigned_to_user_id : "Chưa giao"}</span></span>
                            <div className="flex items-center gap-1.5">
                              {t.status === "OPEN" && (
                                <button onClick={() => { setSelectedTicketForAssign(t); setIsAssignModalOpen(true); }} className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-semibold">
                                  Phân công
                                </button>
                              )}
                              <button onClick={() => { setSelectedTicketForNotes(t); setIsNotesModalOpen(true); }} className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800">
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {colTickets.length === 0 && <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800/80 rounded-xl">Trống</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-y border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Mã Ticket</th>
                    <th className="py-3 px-3">Tiêu Đề</th>
                    <th className="py-3 px-3">Ưu Tiên</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3">Kỹ Thuật Viên</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">TCK-{t.id.toString().padStart(4, "0")}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{t.title}</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400">{t.priority}</span></td>
                      <td className="py-3 px-3 font-mono font-semibold text-cyan-400">{t.status}</td>
                      <td className="py-3 px-3 text-slate-300">{t.assigned_to_user_id ? "Kỹ thuật viên #" + t.assigned_to_user_id : "Chưa phân công"}</td>
                      <td className="py-3 px-3 text-right">
                        {t.status === "OPEN" && (
                          <button onClick={() => { setSelectedTicketForAssign(t); setIsAssignModalOpen(true); }} className="px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px]">
                            Phân công
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Phân Công */}
      {isAssignModalOpen && selectedTicketForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-700 p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-2">Phân Công Kỹ Thuật Viên Xử Lý</h3>
            <p className="text-xs text-slate-400 mb-4">Ticket: <span className="text-indigo-400">{selectedTicketForAssign.title}</span></p>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Chọn Kỹ Thuật Viên</label>
              <select value={selectedTechId} onChange={(e) => setSelectedTechId(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white">
                <option value={3}>Lê Kỹ Thuật Viên (Technician)</option>
                <option value={2}>Nguyễn Văn Vận Hành (Operator)</option>
                <option value={1}>Trần Quản Trị (Administrator)</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300">Hủy</button>
              <button onClick={handleAssignSubmit} className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white">Xác Nhận Phân Công</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Ticket Mới */}
      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-700 p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-2">Tạo Phiếu Bảo Trì / Sự Cố Mới</h3>
            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Tiêu Đề Phiếu</label>
                <input type="text" required value={newTicketData.title} onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Nhập tiêu đề..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Máy Chủ (Node)</label>
                  <select value={newTicketData.node_id} onChange={(e) => setNewTicketData({ ...newTicketData, node_id: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white">
                    <option value={1}>Node Alpha 01 - DB Master</option>
                    <option value={3}>Node Alpha 03 - API Gateway</option>
                    <option value={4}>Node Beta 01 - AI Inference</option>
                    <option value={6}>Node Storage 01 - SAN Node</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Ưu Tiên</label>
                  <select value={newTicketData.priority} onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white">
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Mô Tả Chi Tiết</label>
                <textarea rows={3} required value={newTicketData.description} onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Mô tả sự cố..." />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsCreateTicketModalOpen(false)} className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300">Hủy</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white">Tạo Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Ghi Chú */}
      {isNotesModalOpen && selectedTicketForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-700 p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-1">Ghi Chú Tiến Độ Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">TCK-{selectedTicketForNotes.id}: {selectedTicketForNotes.title}</p>
            <form onSubmit={handleAddNoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Nội Dung Ghi Chú</label>
                <textarea rows={3} required value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Tiến độ xử lý..." />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsNotesModalOpen(false)} className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300">Hủy</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white">Lưu Ghi Chú</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
