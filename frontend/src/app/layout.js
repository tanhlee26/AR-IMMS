import "./globals.css";

export const metadata = {
  title: "AR-IMMS Command Center",
  description: "Trung tâm giám sát hạ tầng Data Center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
