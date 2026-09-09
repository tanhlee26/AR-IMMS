import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "AR-IMMS Web Command Center | Hệ Thống Giám Sát & Bảo Trì Trung Tâm Dữ Liệu",
  description: "Web Command Center giám sát Digital Twin, Telemetry thời gian thực, Quản lý Sự cố và Hiệu quả Năng lượng PUE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans overflow-x-hidden">
        <AuthProvider>
          <div className="flex min-h-screen w-full">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
