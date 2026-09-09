"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "@/lib/types";
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Khôi phục session từ localStorage
    const savedToken = getAuthToken();
    const savedUser = localStorage.getItem("ar_imms_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        clearAuthToken();
      }
    } else {
      // Mặc định nạp user demo Operator để tiện trải nghiệm ngay
      const defaultOperator: UserProfile = {
        id: 2,
        username: "operator",
        email: "operator@ar-imms.local",
        full_name: "Nguyễn Văn Vận Hành",
        role: "SYSTEM_OPERATOR",
        permissions: ["VIEW_DASHBOARD", "ACKNOWLEDGE_ALERT", "ASSIGN_TICKET", "APPROVE_CLOSURE"],
      };
      setUser(defaultOperator);
      localStorage.setItem("ar_imms_user", JSON.stringify(defaultOperator));
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    const res = await apiRequest<{ token: string; user: UserProfile }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });

    setIsLoading(false);
    if (res.success && res.data) {
      const jwtToken = res.data.token;
      const userProfile = res.data.user;
      setToken(jwtToken);
      setUser(userProfile);
      setAuthToken(jwtToken);
      localStorage.setItem("ar_imms_user", JSON.stringify(userProfile));
      return { success: true };
    } else {
      return { success: false, error: res.error || "Sai tên đăng nhập hoặc mật khẩu" };
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    let username = "operator";
    let password = "Operator@123";
    let fullName = "Nguyễn Văn Vận Hành";

    if (role === "ADMINISTRATOR") {
      username = "admin";
      password = "Admin@123";
      fullName = "Trần Quản Trị Hệ Thống";
    } else if (role === "FIELD_TECHNICIAN") {
      username = "technician";
      password = "Tech@123";
      fullName = "Lê Kỹ Thuật Viên Hiện Trường";
    }

    // Thử login qua API trước
    const res = await login(username, password);
    if (res.success) {
      return true;
    }

    // Fallback offline session
    const mockUser: UserProfile = {
      id: role === "ADMINISTRATOR" ? 1 : role === "SYSTEM_OPERATOR" ? 2 : 3,
      username,
      email: `${username}@ar-imms.local`,
      full_name: fullName,
      role,
      permissions: role === "ADMINISTRATOR" ? ["*"] : ["VIEW_DASHBOARD"],
    };
    setUser(mockUser);
    localStorage.setItem("ar_imms_user", JSON.stringify(mockUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}
