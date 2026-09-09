"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Wifi,
  WifiOff,
  User,
  LogOut,
  Shield,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import ConnectionStatusModal from "./ConnectionStatusModal";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(2);

  useEffect(() => {
    // Ping backend kiểm tra sức khỏe
    const pingBackend = async () => {
      const res = await apiRequest("/health");
      setBackendOnline(res.success);
    };
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  if (pathname === "/login") return null;

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Trung Tâm Chỉ Huy & Giám Sát Tổng Thể (Command Center Dashboard)";
      case "/digital-twin":
        return "Cây Phân Cấp Digital Twin (Site → Room → Rack → Server)";
      case "/telemetry":
        return "Biểu Đồ Telemetry Thời Gian Thực (CPU, RAM, Temp, Power)";
      case "/alerts-tickets":
        return "Quản Lý Cảnh Báo Sự Cố & Phiếu Bảo Trì (Alerts & Tickets)";
      case "/closure-approval":
        return "Hội Đồng Phê Duyệt Nghiệm Thu Đóng Ticket (Closure Approval)";
      case "/reports":
        return "Báo Cáo Hiệu Quả Năng Lượng PUE & Xuất Báo Cáo";
      case "/profile":
        return "Hồ Sơ Cá Nhân & Phân Quyền (User Profile & Credentials)";
      default:
        return "AR-IMMS Command Center";
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return { label: "Admin", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "SYSTEM_OPERATOR":
        return { label: "Operator", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
      case "FIELD_TECHNICIAN":
        return { label: "Technician", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      default:
        return { label: "Guest", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <>
      <header className="h-16 flex-shrink-0 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-20">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-indigo-400 border border-slate-700/60">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">{getPageTitle()}</h1>
            <p className="text-[11px] text-slate-400">Hạ tầng Trung tâm Dữ liệu Thông minh AR-IMMS</p>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Backend Connection Health Pill */}
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              backendOnline === true
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : backendOnline === false
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
            title="Nhấn để kiểm tra chẩn đoán kết nối Backend"
          >
            {backendOnline === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Backend: Connected</span>
              </>
            ) : backendOnline === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Backend: Offline</span>
              </>
            ) : (
              <span>Kiểm tra kết nối...</span>
            )}
          </button>

          {/* Alert Notification Bell */}
          <button
            onClick={() => router.push("/alerts-tickets")}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            title="Cảnh báo sự cố đang mở"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Pill - Click mở trang Thông tin cá nhân */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/80 transition group text-left"
              title="Nhấn để xem thông tin cá nhân (Username, Email, Role)"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:ring-2 group-hover:ring-indigo-400 transition">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition flex items-center gap-1.5">
                  {user?.full_name || "Người dùng"}
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-slate-300 transition">
                  @{user?.username || "user"} • {user?.email || "user@ar-imms.local"}
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal kiểm tra kết nối chi tiết */}
      <ConnectionStatusModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
