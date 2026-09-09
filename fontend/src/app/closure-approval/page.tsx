"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Server,
  FileText,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { TicketItem } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function ClosureApprovalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingTickets, setPendingTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // Modal từ chối
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPendingTickets = async () => {
    setLoading(true);
    const res = await apiRequest<TicketItem[]>("/api/v1/tickets?status=PENDING_CLOSURE");

    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setPendingTickets(res.data);
      setSelectedTicket(res.data[0]);
    } else {
      // Fallback demo ticket nếu chưa có dữ liệu backend
      const fallbackList: TicketItem[] = [
        {
          id: 3,
          node_id: 6,
          node_name: "Server Storage 01 - SAN Node",
          title: "Thay thế module quạt làm mát dự phòng Node Storage 01",
          description: "Kỹ thuật viên đã kiểm tra và thay thế quạt hot-swap Fan-02 tại hiện trường, gửi yêu cầu nghiệm thu đóng ticket.",
          priority: "MEDIUM",
          status: "PENDING_CLOSURE",
          assigned_to_user_id: 3,
          assigned_to_name: "Lê Kỹ Thuật Viên (Technician)",
          created_at: "2026-09-08T07:15:00Z",
          closure_request: {
            ticket_id: 3,
            requested_by_user_id: 3,
            summary: "Đã hoàn tất thay module quạt Hot-Swap Fan 02 tại mặt sau Server Storage 01",
            resolution_details: "Đã tháo module quạt cũ bị rơ bạc đạn, lắp quạt Delta 12V chính hãng mới. Nhiệt độ ổ đĩa SAN hạ từ 54°C xuống 38°C ổn định. Hệ thống vận hành trơn tru.",
            status: "PENDING",
            created_at: "2026-09-08T10:45:00Z",
          },
        },
      ];
      setPendingTickets(fallbackList);
      setSelectedTicket(fallbackList[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPendingTickets();
  }, []);

  // 1. Phê Duyệt Đóng Ticket (Approve Closure)
  const handleApprove = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    setActionMessage(null);

    const res = await apiRequest(`/api/v1/tickets/${selectedTicket.id}/approve-closure`, {
      method: "POST",
    });

    setActionLoading(false);
    if (res.success) {
      setActionMessage({
        type: "success",
        text: `Đã phê duyệt nghiệm thu đóng Ticket TCK-${selectedTicket.id.toString().padStart(4, "0")} thành công. Lịch sử bảo trì đã được cập nhật.`,
      });
      // Loại bỏ ticket khỏi danh sách pending
      setPendingTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id));
      setSelectedTicket(null);
    } else {
      setActionMessage({
        type: "error",
        text: res.error || "Không thể phê duyệt đóng ticket.",
      });
    }
  };

  // 2. Từ Chối Nghiệm Thu (Reject Closure)
  const handleReject = async () => {
    if (!selectedTicket || !rejectionReason.trim()) return;
    setActionLoading(true);

    const res = await apiRequest(`/api/v1/tickets/${selectedTicket.id}/reject-closure`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });

    setActionLoading(false);
    setIsRejectModalOpen(false);
    setRejectionReason("");

    if (res.success) {
      setActionMessage({
        type: "success",
        text: `Đã từ chối đóng Ticket TCK-${selectedTicket.id.toString().padStart(4, "0")}. Phiếu đã chuyển về trạng thái IN_PROGRESS để xử lý lại.`,
      });
      setPendingTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id));
      setSelectedTicket(null);
    } else {
      setActionMessage({
        type: "error",
        text: res.error || "Không thể từ chối ticket.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Hội Đồng Phê Duyệt Nghiệm Thu Đóng Ticket (Closure Approval)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cơ chế kiểm soát 2 bước (BR-04 Step-up Verification) dành cho Quản trị viên & Vận hành viên nghiệm thu kết quả kỹ thuật
          </p>
        </div>

        <button
          onClick={loadPendingTickets}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới danh sách
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Main Grid: Danh sách chờ bên trái, Biên bản giải trình bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Danh Sách Phiếu Chờ Duyệt (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Phiếu Chờ Phê Duyệt ({pendingTickets.length})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              PENDING CLOSURE
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1 flex-1">
            {pendingTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? "bg-indigo-600/15 border-indigo-500/60 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-indigo-400">
                      TCK-{t.id.toString().padStart(4, "0")}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        t.priority === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400"
                          : t.priority === "HIGH"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-2">{t.title}</h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-3 h-3 text-indigo-400" />
                      {t.assigned_to_name || "Lê Kỹ Thuật Viên"}
                    </span>
                    <span className="font-mono text-slate-500">
                      {t.created_at ? t.created_at.slice(0, 10) : ""}
                    </span>
                  </div>
                </div>
              );
            })}

            {pendingTickets.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                Hiện không có phiếu bảo trì nào đang chờ phê duyệt đóng.
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Biên Bản Báo Cáo Nghiệm Thu Chi Tiết (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-5">
              {/* Header phiếu */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    Mã Phiếu: TCK-{selectedTicket.id.toString().padStart(4, "0")}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                    Đang Chờ Nghiệm Thu
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedTicket.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Mô tả sự cố ban đầu: {selectedTicket.description}</p>
              </div>

              {/* Thông tin kỹ thuật viên & thiết bị */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Kỹ Thuật Viên Hiện Trường</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedTicket.assigned_to_name || "Lê Kỹ Thuật Viên (Technician)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Máy Chủ Liên Quan (Node)</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedTicket.node_name || `Server Node #${selectedTicket.node_id}`}
                  </span>
                </div>
              </div>

              {/* Báo Cáo Nghiệm Thu Từ Kỹ Thuật Viên */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  Báo Cáo Giải Trình & Nghiệm Thu Kỹ Thuật
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                    Tóm Tắt Khắc Phục (Summary)
                  </label>
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 font-medium">
                    {selectedTicket.closure_request?.summary ||
                      "Đã hoàn tất thay thế module linh kiện và đo kiểm an toàn tại hiện trường."}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                    Chi Tiết Giải Pháp & Thông Số Kiểm Đo (Resolution Details)
                  </label>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
                    {selectedTicket.closure_request?.resolution_details ||
                      "Đã thay linh kiện mới, vệ sinh luồng gió tản nhiệt. Đo kiểm lại nhiệt độ hạ từ 54°C xuống 38°C ổn định. Hệ thống vận hành an toàn."}
                  </div>
                </div>
              </div>

              {/* Tiêu chuẩn phê duyệt BR-04 */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 leading-relaxed">
                <span className="font-bold">Quy chuẩn phê duyệt BR-04:</span> Khi nhấn "Phê Duyệt Đóng", hệ thống sẽ chính thức khóa ticket, ghi nhận thời gian khắc phục (MTTR) và tự động tạo bản ghi Lịch Sử Bảo Trì vào cơ sở dữ liệu.
              </div>

              {/* Thao tác Phê Duyệt / Từ Chối */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition"
                >
                  <XCircle className="w-4 h-4" />
                  Từ Chối Nghiệm Thu
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {actionLoading ? "Đang Xử Lý..." : "Phê Duyệt Đóng Ticket"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 text-xs">
              Chọn một phiếu bảo trì từ danh sách bên trái để xem biên bản giải trình nghiệm thu
            </div>
          )}
        </div>
      </div>

      {/* Modal Từ Chối Nghiệm Thu */}
      {isRejectModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-700 p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Từ Chối Nghiệm Thu Đóng Ticket
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ticket: <span className="text-indigo-400 font-semibold">{selectedTicket.title}</span>
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Lý Do Từ Chối (Bắt Buộc)
              </label>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nêu rõ lý do chưa đạt yêu cầu (ví dụ: nhiệt độ chưa hạ về mức an toàn, thiếu biên bản đo kiểm...)"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
