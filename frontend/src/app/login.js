"use client";
import { useState } from "react";
import { api, tokenStorage } from "../lib/api";

/**
 * LoginPage – Form đăng nhập AR-IMMS
 * Gọi POST /api/v1/auth/login, lưu JWT, rồi báo lên cha qua onSuccess(userData)
 */
export default function LoginPage({ onSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await api.login(identifier.trim(), password);
      tokenStorage.set(result.access_token);
      onSuccess(result.user);
    } catch (err) {
      setError(
        err.message === "Tên đăng nhập hoặc mật khẩu không chính xác."
          ? err.message
          : "Đăng nhập thất bại. Kiểm tra lại thông tin hoặc kết nối backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-mark login-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
          </div>
          <div>
            <strong>AR-IMMS</strong>
            <span>COMMAND CENTER</span>
          </div>
        </div>

        <h2 className="login-title">Đăng nhập hệ thống</h2>
        <p className="login-sub">Nhập thông tin xác thực để truy cập trung tâm điều hành</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Identifier */}
          <div className="login-field">
            <label htmlFor="login-id">Tên đăng nhập hoặc Email</label>
            <input
              id="login-id"
              type="text"
              autoComplete="username"
              placeholder="admin hoặc admin@ar-imms.io"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="login-pwd">Mật khẩu</label>
            <div className="pwd-wrap">
              <input
                id="login-pwd"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="pwd-toggle"
                aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="login-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner" aria-hidden="true"/>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            )}
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>

        <p className="login-hint">
          Tài khoản mẫu: <code>admin</code> / <code>Admin@123</code>
        </p>
      </div>
    </div>
  );
}
