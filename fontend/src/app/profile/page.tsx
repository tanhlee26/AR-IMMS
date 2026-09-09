"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Key,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowLeft,
  LogOut,
  RefreshCw,
  BadgeCheck,
  Smartphone,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, quickDemoLogin, isLoading } = useAuth();
  const [switchLoading, setSwitchLoading] = useState(false);

  const getRoleConfig = (role?: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return {
          title: "Quản Trị Viên Toàn Quyền",
          subtitle: "Administrator - System Admin Lead",
          badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          gradient: "from-purple-600 to-indigo-600",
          permissions: [
            "Toàn quyền quản trị hạ tầng & cấu hình ngưỡng (Full Control)",
            "Phê duyệt nghiệm thu đóng ticket bảo trì (Closure Approval)",
            "Quản lý danh sách người dùng & phân quyền RBAC",
            "Xem báo cáo chỉ số năng lượng PUE & MTTR",
            "Xuất dữ liệu báo cáo chuyên sâu Excel / PDF",
          ],
        };
      case "SYSTEM_OPERATOR":
        return {
          title: "Vận Hành Viên Trung Tâm Điều Hành",
          subtitle: "Operator - Command Center Specialist",
          badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
          gradient: "from-cyan-600 to-blue-600",
          permissions: [
            "Giám sát Telemetry và hạ tầng Digital Twin thời gian thực",
            "Tiếp nhận & Xác nhận cảnh báo sự cố (Acknowledge Alert)",
            "Tạo phiếu bảo trì & Phân công Kỹ thuật viên (Assign Tech)",
            "Phê duyệt / Từ chối yêu cầu đóng ticket (Closure Approval)",
            "Xem và xuất báo cáo hiệu quả năng lượng PUE",
          ],
        };
      case "FIELD_TECHNICIAN":
        return {
          title: "Kỹ Thuật Viên Hiện Trường",
          subtitle: "Technician - Field Support & AR Maintenance",
          badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          gradient: "from-amber-600 to-orange-600",
          permissions: [
            "Nhận phân công ticket sự cố & cập nhật tiến độ kỹ thuật",
            "Quét tem ArUco / QR Code thực tế ảo trên máy chủ (Mobile AR)",
            "Đo kiểm và thay thế module phần cứng trực tiếp tại tủ Rack",
            "Gửi yêu cầu nghiệm thu đóng ticket kèm giải trình kỹ thuật",
          ],
        };
      default:
        return {
          title: "Người Dùng Hệ Thống",
          subtitle: "Standard User",
          badgeColor: "bg-slate-500/15 text-slate-400 border-slate-500/30",
          gradient: "from-slate-600 to-slate-800",
          permissions: ["Xem thông tin tổng quan"],
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);

  const handleSwitchRole = async (targetRole: UserRole) => {
    setSwitchLoading(true);
    await quickDemoLogin(targetRole);
    setSwitchLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <span className="text-xs text-slate-500 font-mono">
          Session ID: <span className="text-indigo-400 font-bold">#US-{user?.id || 2}</span>
        </span>
      </div>

      {/* Main Profile Identity Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative Background Cyber Circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Lớn */}
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr ${roleConfig.gradient} flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-indigo-600/20 flex-shrink-0 border-2 border-white/20`}
          >
            {user?.full_name?.charAt(0) || "U"}
          </div>

          {/* Thông Tin Chính */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-wide">
                {user?.full_name || "Chưa cập nhật"}
              </h2>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${roleConfig.badgeColor}`}
              >
                {user?.role || "GUEST"}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> Hoạt động
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-400">{roleConfig.title} • {roleConfig.subtitle}</p>

            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Tên Đăng Nhập (Username)</span>
                  <span className="font-mono font-bold text-slate-200">@{user?.username || "unknown"}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Email Công Vụ</span>
                  <span className="font-mono font-medium text-slate-200">{user?.email || "user@ar-imms.local"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Quyền Hạn RBAC & Thông Tin Bảo Mật Phiên Làm Việc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: Danh Sách Quyền Hạn Phân Quyền RBAC */}
        <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Quyền Hạn Được Cấp (RBAC Permissions)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Dựa trên vai trò <span className="font-mono text-indigo-400 font-bold">{user?.role}</span> trong hệ thống
            </p>

            <div className="space-y-2.5">
              {roleConfig.permissions.map((perm, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{perm}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tiêu chuẩn bảo mật:</span>
            <span className="font-mono text-slate-400">Role-Based Access Control v1.0</span>
          </div>
        </div>

        {/* Cột 2: Bảo Mật & Đổi Vai Trò Thử Nghiệm */}
        <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Chuyển Đổi Vai Trò Trải Nghiệm (Role Switcher)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Kiểm thử giao diện với quyền Administrator, Operator hoặc Technician
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSwitchRole("ADMINISTRATOR")}
                disabled={switchLoading || user?.role === "ADMINISTRATOR"}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition ${
                  user?.role === "ADMINISTRATOR"
                    ? "bg-purple-950/30 border-purple-500/40 text-purple-300"
                    : "bg-slate-900 border-slate-800 hover:border-purple-500/30 text-slate-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Chuyển sang Administrator (Admin)</span>
                </div>
                {user?.role === "ADMINISTRATOR" && <span className="text-[10px] font-mono font-bold">Hiện Tại</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("SYSTEM_OPERATOR")}
                disabled={switchLoading || user?.role === "SYSTEM_OPERATOR"}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition ${
                  user?.role === "SYSTEM_OPERATOR"
                    ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-300"
                    : "bg-slate-900 border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Chuyển sang System Operator (Operator)</span>
                </div>
                {user?.role === "SYSTEM_OPERATOR" && <span className="text-[10px] font-mono font-bold">Hiện Tại</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("FIELD_TECHNICIAN")}
                disabled={switchLoading || user?.role === "FIELD_TECHNICIAN"}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition ${
                  user?.role === "FIELD_TECHNICIAN"
                    ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                    : "bg-slate-900 border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Chuyển sang Field Technician (Tech)</span>
                </div>
                {user?.role === "FIELD_TECHNICIAN" && <span className="text-[10px] font-mono font-bold">Hiện Tại</span>}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất khỏi hệ thống
            </button>

            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Về Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
