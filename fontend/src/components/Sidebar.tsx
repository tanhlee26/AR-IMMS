"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  BarChart3,
  Boxes,
  ShieldAlert,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  {
    name: "Dashboard Tổng Quan",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Cây Phân Cấp Digital Twin",
    href: "/digital-twin",
    icon: Network,
    badge: "3D/Tree",
  },
  {
    name: "Telemetry Thời Gian Thực",
    href: "/telemetry",
    icon: Activity,
    badge: "Live",
  },
  {
    name: "Quản Lý Alert & Ticket",
    href: "/alerts-tickets",
    icon: AlertTriangle,
    badge: "Active",
  },
  {
    name: "Duyệt Đóng Ticket",
    href: "/closure-approval",
    icon: ClipboardCheck,
    badge: "Approval",
  },
  {
    name: "Báo Cáo Thống Kê PUE",
    href: "/reports",
    icon: BarChart3,
    badge: "PDF/XLS",
  },
  {
    name: "Hồ Sơ & Quyền Hạn",
    href: "/profile",
    icon: User,
    badge: "Profile",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Ẩn sidebar ở trang đăng nhập
  if (pathname === "/login") return null;

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0c1222] border-r border-slate-800 flex flex-col min-h-screen">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/40 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg tracking-wider">
          AR
        </div>
        <div>
          <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
            AR-IMMS <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v1.0</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Command Center Web</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Phân Hệ Điều Hành
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                    isActive
                      ? "bg-indigo-700/80 text-indigo-100"
                      : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status Info */}
      <div className="p-3 m-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Hạ Tầng Digital Twin
          </span>
          <span className="text-emerald-400 font-mono text-[11px] font-bold">ONLINE</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Giám sát tập trung đa trung tâm dữ liệu Hòa Lạc & HCM
        </p>
      </div>
    </aside>
  );
}
