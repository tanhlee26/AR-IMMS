# AR-IMMS: AR-Integrated Infrastructure Monitoring and Maintenance System

![AR-IMMS Banner](https://img.shields.io/badge/System-AR--IMMS-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Python](https://img.shields.io/badge/Python-3.11+-informational.svg)
![Flask](https://img.shields.io/badge/Framework-Flask-green.svg)
![LaTeX](https://img.shields.io/badge/Docs-LaTeX-red.svg)
![University](https://img.shields.io/badge/University-University%20of%20Transport%20Ho%20Chi%20Minh%20City-navy.svg)

**Hệ thống Giám sát và Bảo trì Cơ sở Hạ tầng Tích hợp Thực tế Tăng cường (AR-IMMS)** kết hợp giữa mô hình **Digital Twin**, truyền phát dữ liệu đo đạc thời gian thực (**Telemetry Streaming**) và công nghệ **Thực tế Tăng cường (Augmented Reality)** để tối ưu hóa công tác giám sát, phát hiện sự cố và bảo trì thiết bị trong Data Center.

---

## 🏛️ Kiến trúc Tổng quan Dự án (Project Architecture)

Dự án được cấu trúc theo mô hình **Modular Monorepo** bao gồm 4 mô-đun phần mềm chính và hệ thống tài liệu chuẩn IEEE 830:

```
AR-IMMS/
├── .env.example                # Bản mẫu biến môi trường chuẩn
├── .gitignore                  # Cấu hình lọc rác biên dịch Python, Node, LaTeX
├── README.md                   # Tài liệu hướng dẫn hệ thống
├── docker-compose.yml          # Cấu hình containerization cho toàn bộ hệ thống
│
├── backend/                    # [Mô-đun 1] Backend REST API & WebSocket Gateway Server
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── app.py              # Entrypoint chính của ứng dụng Flask Backend
│       ├── api/                # Controllers, Middlewares, Schemas, Response helpers
│       ├── core/               # App Configurations, DI Container, Logging, Exceptions
│       ├── domain/             # Entities, Data Models, Business Constants
│       ├── infrastructure/     # Database Postgres, Repositories, ORM Models
│       └── services/           # Tầng xử lý logic nghiệp vụ (Auth, Hierarchy, Telemetry...)
│
├── collector/                  # [Mô-đun 2] Telemetry Collector Agent (Chạy trên Server/Node)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       └── agent.py            # Tiến trình tự động đọc thông số CPU/RAM/Temp & gửi WS
│
├── frontend/                   # [Mô-đun 3] Web Command Center (Next.js / React Dashboard)
│   ├── package.json
│   └── src/
│
├── mobile/                     # [Mô-đun 4] Mobile AR Application (React Native / Android Client)
│   ├── package.json
│   └── src/
│
└── docs/                       # Quản lý toàn bộ tài liệu & sơ đồ thiết kế
    ├── SRS/                    # Đặc tả Yêu cầu Phần mềm (SRS LaTeX & PDF Final)
    │   ├── SRS.tex             # Mã nguồn LaTeX tổng hợp
    │   ├── SRS.pdf             # Bản PDF hoàn chỉnh (40 trang)
    │   ├── chap1_introduction.tex đến chap9_appendices.tex
    │   └── figures/            # Sơ đồ minh họa nhúng trong SRS (usecase.png, ERD.png)
    ├── diagrams/               # Các tệp thiết kế sơ đồ (.drawio)
    │   ├── ERD.drawio
    │   └── usecasear.drawio
    └── raw_docs/               # Tài liệu thô và đề xuất dự án
        ├── research_theme.txt
        └── *.docx
```

---

## ⚡ Các Tính năng Nổi bật (Key Features)

1. **Mô hình hóa Digital Twin phân cấp:**
   - Quản lý hạ tầng không gian theo cây quan hệ chuẩn: $\text{Site} \rightarrow \text{Room} \rightarrow \text{Rack} \rightarrow \text{Server/Node} \rightarrow \text{Workload/Container}$.
2. **Thu thập \& Phát dòng Telemetry thời gian thực:**
   - Monitoring Agent thu thập thông số phần cứng (CPU, RAM, Nhiệt độ, Disk, Network) và Docker stats theo chu kỳ 5s/lần.
   - Tự động đánh dấu máy chủ ngắt kết nối (*Unavailable*) nếu mất tín hiệu quá 90s.
3. **Kết nối Dữ liệu Số với Hiện trường qua AR:**
   - Kỹ thuật viên quét mã QR/ArUco Marker trên vỏ máy chủ để hiển thị các thẻ lớp phủ số liệu ảo (AR Overlay) ngay trên camera di động.
4. **Quy trình Quản lý Cảnh báo \& Ticket Khép kín:**
   - Tự động phát hiện bất thường, lọc trùng bão cảnh báo (Alert Storm Suppression).
   - Khởi tạo Ticket, phân công Kỹ thuật viên, xác thực 2 bước (Step-up Verification) cho thao tác nguy hiểm và phê duyệt nghiệm thu đóng Ticket.
5. **Nhật ký Kiểm toán Bất biến (Immutable Audit Trail):**
   - Lưu trữ vĩnh viễn mọi hành động tác động hệ thống phục vụ truy vết và báo cáo chỉ số PUE.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Backend

### 1. Yêu cầu Môi trường
- Python 3.10+
- PostgreSQL (hoặc Supabase URL) / SQLite fallback
- MiKTeX / TeX Live (nếu muốn biên dịch lại tài liệu LaTeX SRS)

### 2. Thiết lập Biến môi trường
Tạo tệp `.env` dựa trên bản mẫu `.env.example`:
```bash
cp .env.example .env
```

### 3. Cài đặt Thư viện \& Chạy Backend API
```bash
cd backend
python -m venv .venv
# Trên Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Trên Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python src/app.py
```
Backend API sẽ khởi chạy tại: `http://localhost:5000` (Kiểm tra sức khỏe dịch vụ: `http://localhost:5000/health`).

---

## 📄 Hướng dẫn Biên dịch Tài liệu SRS (LaTeX)

Tài liệu SRS được soạn thảo theo chuẩn IEEE 830 bằng ngôn ngữ LaTeX mô-đun hóa trong thư mục `docs/SRS/`.

Để biên dịch ra tệp PDF hoàn chỉnh:
```bash
cd docs/SRS
pdflatex -interaction=nonstopmode SRS.tex
```
Kết quả bản PDF hoàn chỉnh (40 trang) sẽ được xuất tại: `docs/SRS/SRS.pdf`.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

- **Backend API:** Python, Flask, SQLAlchemy, JWT, WebSocket/Socket.IO
- **Data Collector Agent:** Python, `psutil`, `requests`, `websocket-client`
- **Web Dashboard:** Next.js, React, Lucide Icons, WebSocket Gateway
- **Mobile AR App:** React Native, OpenCV / ArUco Computer Vision, Android Camera
- **Database:** PostgreSQL / Supabase, Time-series metric store
- **Documentation:** LaTeX (MiKTeX/TeXLive), Draw.io

---

## 👥 Đơn vị Thực hiện

**Dự án:** AR-Integrated Infrastructure Monitoring and Maintenance System (AR-IMMS)  
**Trường:** Đại học Giao thông vận tải TP. Hồ Chí Minh (*University of Transport Ho Chi Minh City*)  
**Phiên bản:** 1.0.0 (Phê duyệt Final)
