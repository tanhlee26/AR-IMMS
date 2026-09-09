"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key, User, Server, ArrowRight, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, quickDemoLogin, isLoading } = useAuth();

  const [username, setUsername] = useState("operator");
  const [password, setPassword] = useState("Operator@123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    const res = await login(username, password);
    setSubmitting(false);

    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setSubmitting(true);
    await quickDemoLogin(role);
    setSubmitting(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-600/20 text-white font-black text-2xl mb-4">
            AR
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">AR-IMMS Command Center</h2>
          <p className="text-sm text-slate-400 mt-1">
            Hệ thống Giám sát & Quản lý Bảo trì Trung tâm Dữ liệu
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Tên đăng nhập / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin / operator / technician"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? "Đang xác thực..." : "Đăng Nhập Hệ Thống"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login 1-Click */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Đăng Nhập Nhanh Trải Nghiệm (1-Click Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("ADMINISTRATOR")}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-center transition group"
              >
                <div className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300">Admin</div>
                <div className="text-[9px] text-slate-500">Quản trị viên</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("SYSTEM_OPERATOR")}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-center transition group"
              >
                <div className="text-[11px] font-bold text-cyan-400 group-hover:text-cyan-300">Operator</div>
                <div className="text-[9px] text-slate-500">Vận hành viên</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("FIELD_TECHNICIAN")}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-center transition group"
              >
                <div className="text-[11px] font-bold text-amber-400 group-hover:text-amber-300">Technician</div>
                <div className="text-[9px] text-slate-500">Kỹ thuật viên</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="text-center mt-6 text-xs text-slate-600">
          AR-IMMS Security Gateway • Chuẩn bảo mật RBAC & JWT HMAC-256
        </div>
      </div>
    </div>
  );
}
