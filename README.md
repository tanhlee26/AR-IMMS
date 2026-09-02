# AR-IMMS: AR-Integrated Infrastructure Monitoring and Maintenance System

![AR-IMMS Banner](https://img.shields.io/badge/System-AR--IMMS-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Python](https://img.shields.io/badge/Python-3.11+-informational.svg)
![Flask](https://img.shields.io/badge/Framework-Flask-green.svg)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-blue.svg)
![WebSocket](https://img.shields.io/badge/RealTime-Socket.IO-black.svg)
![LaTeX](https://img.shields.io/badge/Docs-LaTeX-red.svg)
![University](https://img.shields.io/badge/University-University%20of%20Transport%20Ho%20Chi%20Minh%20City-navy.svg)

**Hệ thống Giám sát và Bảo trì Cơ sở Hạ tầng Tích hợp Thực tế Tăng cường (AR-IMMS)** kết hợp giữa mô hình **Digital Twin**, truyền phát dữ liệu đo đạc thời gian thực (**Telemetry Streaming**), thuật toán **Lọc bão Cảnh báo (Alert Storm Deduplication)** và công nghệ **Thực tế Tăng cường (Augmented Reality)** để tối ưu hóa công tác giám sát, phát hiện sự cố và bảo trì thiết bị trong Data Center.

---

## 👥 Phân công Nhân sự & Vai trò Scrum (Team Assignments)

Dự án được thực hiện theo phương pháp luận **Agile/Scrum** trong vòng 4 tuần (Mô phỏng thử nghiệm thực tế trên **4 Laptop LAN đóng vai trò như Server** và **Camera Điện thoại di động quét mã QR/ArUco**):

| Thành viên | Vai trò Scrum | Phân công Nhiệm vụ Chính |
| :--- | :--- | :--- |
| **Thế Anh** | **Dev 1 (Backend & DB Lead)** | Thiết kế CSDL Postgres/Supabase, 20 ORM Models, JWT & RBAC, Telemetry Ingestion API, WebSocket Gateway, Engine Cảnh báo & Thuật toán Lọc bão Alert, API Quản lý Vòng đời Ticket. |
| **Ngọc Ân** | **Dev 2 (Testbed & Collector Lead)** | Thiết lập Testbed 4 Laptop LAN, xây dựng Collector Agent Daemon (`psutil`), Hàng đợi bộ nhớ đệm Offline Queue, Module giám sát Docker Containers. |
| **Thiện Nhân** | **Dev 3 (Product Owner & Web Lead)** | Quản lý Product Backlog, xây dựng Giao diện Web Command Center (Next.js), Sơ đồ cây Digital Twin và Đồ thị Telemetry thời gian thực. |
| **Duy Khang** | **Dev 4 (Mobile AR Lead)** | Xây dựng Ứng dụng di động Mobile AR (React Native/Android), Nhận diện QR/ArUco Marker, Hiển thị thẻ số liệu ảo AR Overlay và Giao diện Xử lý Ticket Nghiệm thu. |

---

## 🏛️ Kiến trúc Cấu trúc Dự án (Monorepo Architecture)

```
AR-IMMS/
├── .env.example                # Bản mẫu biến môi trường chuẩn (Postgres URL, JWT Key, Telemetry Interval)
├── .gitignore                  # Cấu hình lọc rác biên dịch Python, Node, Mobile, SQLite, LaTeX
├── README.md                   # Tài liệu hướng dẫn hệ thống
├── requirements.txt            # Tập hợp dependencies dùng chung (Flask, SQLAlchemy, SocketIO, psutil, PyJWT)
├── docker-compose.yml          # Cấu hình containerization cho toàn bộ hệ thống
│
├── backend/                    # [Mô-đun 1] Backend REST API & WebSocket Gateway Server
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── app.py              # Entrypoint chính của ứng dụng Flask Backend & WebSocket Gateway
│       ├── api/                # Controllers (Auth, Telemetry, Alert, Ticket), Middleware RBAC, Responses
│       ├── core/               # App Configurations, Dependency Container, Cors, WebSocket Gateway
│       ├── domain/             # Domain Exceptions & Custom Errors
│       ├── infrastructure/     # CSDL Supabase Postgres, SQLAlchemy 20 Models, Repositories
│       └── services/           # Logic Nghiệp vụ (Auth, Telemetry, Alerting Engine, Ticket Lifecycle)
│
├── collector/                  # [Mô-đun 2] Telemetry Collector Agent (Chạy trên 4 Laptop Server)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── agent.py            # Tiến trình Daemon tự động thu thập và truyền phát Telemetry
│       ├── metrics.py          # Thu thập thông số phần cứng psutil (CPU, RAM, Temp, Disk, Net, Docker)
│       └── buffer.py           # Hàng đợi lưu đệm đọng 1.000 bản tin khi ngắt mạng (BR-05 / NFR-REL-01)
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
    ├── scrum_backlog.md        # Kế hoạch Backlog 4 Sprint, Ma trận phụ thuộc & Script Demo 15 phút
    ├── SRS/                    # Đặc tả Yêu cầu Phần mềm (SRS LaTeX & PDF Final 40 trang)
    │   ├── SRS.tex             # Mã nguồn LaTeX tổng hợp
    │   └── SRS.pdf             # Bản PDF hoàn chỉnh
    └── diagrams/               # Sơ đồ thiết kế hệ thống ERD & Use Case (.drawio)
```

---

## ⚡ Các Tính năng Cốt lõi Đã Hoàn thành (Implemented Core Features)

1. **Mô hình hóa Hạ tầng Digital Twin 15 Thực thể:**
   - Định nghĩa 20 SQLAlchemy ORM Models tổ chức phân cấp: $\text{Site} \rightarrow \text{Room} \rightarrow \text{Rack} \rightarrow \text{Node} \rightarrow \text{Workload/Container}$.
   - Tự động kết nối CSDL **Supabase PostgreSQL Cloud** (`aws-0-ap-northeast-2.pooler.supabase.com`) với cơ chế tự động dự phòng **SQLite local** (`default.db`) khi bị ngắt kết nối mạng.
2. **Xác thực JWT Token & Phân quyền RBAC 3 Vai trò:**
   - Phân quyền chặt chẽ: `ADMINISTRATOR` (Quản trị toàn quyền), `SYSTEM_OPERATOR` (Trực ca Command Center), `FIELD_TECHNICIAN` (Kỹ thuật viên hiện trường Mobile AR).
   - Tự động seed tài khoản mặc định: `admin`, `operator`, `technician`.
3. **Collector Agent Daemon & Hàng đợi Offline Buffer Queue:**
   - Đọc chỉ số CPU, RAM, Nhiệt độ CPU °C, Dung lượng Đĩa cứng, Tốc độ mạng Rx/Tx KB/s và trạng thái Docker Containers theo chu kỳ 5 giây/lần.
   - Lưu trữ bộ nhớ đệm lên tới 1.000 bản tin đọng khi đứt mạng và tự động phát bù (flush) về Backend ngay khi có mạng trở lại.
4. **WebSocket / Socket.IO Gateway Hai chiều Thời gian thực:**
   - Phân luồng các kênh truyền (Rooms): `dashboard`, `ar_clients`, `node_<id>`, `agents`.
   - Phát truyền tức thì sự kiện `telemetry_update`, `alert_event`, `node_status_change` với độ trễ $<50\text{ms}$.
5. **Engine So sánh Ngưỡng Cảnh báo & Thuật toán Khử trùng Bão Alert (Debouncing):**
   - Đánh giá ngưỡng Warning / Critical cho CPU, RAM, Nhiệt độ và Đĩa cứng.
   - **Khử trùng bão Alert:** Ngăn chặn việc spam hàng trăm bản ghi trùng lặp khi agent stream telemetry mỗi 5s. Cập nhật trực tiếp giá trị đo đạc vào alert đang mở.
   - **Tự động khôi phục (Auto-Resolve):** Tự động chuyển alert về trạng thái `RESOLVED` và trả màu sắc node về `ONLINE` khi chỉ số phần cứng hạ nhiệt.
   - **Giám sát Mất kết nối (Heartbeat Timeout):** Phát hiện node ngừng phát tín hiệu quá 90s, tự động cập nhật trạng thái `UNAVAILABLE` và bật báo động.
6. **API Quản lý Vòng đời Ticket Khép kín (Step-up Verification - BR-04):**
   - Chuyển đổi trạng thái ticket: `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `PENDING_CLOSURE` $\rightarrow$ `CLOSED`.
   - Bắt buộc Kỹ thuật viên gửi Yêu cầu Nghiệm thu (Closure Request) để Vận hành viên phê duyệt đóng ticket. Tự động ghi nhận hồ sơ **Lịch sử Bảo trì Thiết bị (Maintenance History)**.

---

## 📡 Danh sách API Endpoints Chính

| Phương thức | Endpoint API | Chức năng & Quyền hạn |
| :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | Đăng nhập tài khoản, trả về JWT Access Token & Vai trò RBAC |
| **POST** | `/api/v1/auth/register` | Đăng ký tài khoản người dùng mới |
| **GET** | `/api/v1/auth/me` | Trích xuất thông tin cá nhân & quyền hạn (Yêu cầu JWT Bearer Token) |
| **POST** | `/api/v1/auth/seed-users` | Khởi tạo 3 tài khoản thử nghiệm mẫu và danh sách vai trò |
| **GET** | `/api/v1/nodes/<node_id>/telemetry/realtime` | Trích xuất chỉ số thời gian thực, alert đang bật và cây Digital Twin |
| **GET** | `/api/v1/telemetry/markers/<marker_code>/realtime` | Trích xuất thông số telemetry đính kèm tọa độ 3D AR Overlay khi quét QR/ArUco |
| **POST** | `/api/v1/telemetry` | Collector Agent gửi bản tin telemetry snapshot |
| **GET** | `/api/v1/nodes/<node_id>/telemetry/history` | Trích xuất chuỗi thời gian lịch sử đo đạc vẽ đồ thị |
| **GET** | `/api/v1/alerts` | Lấy danh sách các cảnh báo (Alerts) đang mở |
| **POST** | `/api/v1/alerts/<alert_id>/acknowledge` | Vận hành viên xác nhận tiếp nhận xử lý Alert |
| **GET** | `/api/v1/alert-thresholds` | Trích xuất danh sách cấu hình ngưỡng cảnh báo |
| **POST** | `/api/v1/alerts/check-heartbeats` | Kiểm tra mất kết nối Heartbeat quá hạn >90s |
| **GET** | `/api/v1/tickets` | Trích xuất danh sách Ticket bảo trì theo bộ lọc |
| **POST** | `/api/v1/tickets` | Tạo mới một Phiếu công việc Ticket |
| **POST** | `/api/v1/tickets/<ticket_id>/assign` | Phân công Kỹ thuật viên xử lý Ticket (`IN_PROGRESS`) |
| **POST** | `/api/v1/tickets/<ticket_id>/notes` | Đăng ghi chú cập nhật tiến độ hiện trường |
| **POST** | `/api/v1/tickets/<ticket_id>/request-closure` | Kỹ thuật viên gửi Yêu cầu Nghiệm thu đóng Ticket (`PENDING_CLOSURE`) |
| **POST** | `/api/v1/tickets/<ticket_id>/approve-closure` | Vận hành viên phê duyệt đóng Ticket (`CLOSED` & Lưu Lịch sử Bảo trì) |
| **POST** | `/api/v1/tickets/<ticket_id>/reject-closure` | Vận hành viên từ chối yêu cầu đóng Ticket |

---

## 🚀 Hướng dẫn Khởi chạy Hệ thống Backend & Collector Agent

### 1. Thiết lập Môi trường & Biến môi trường
Tạo tệp `.env` dựa trên bản mẫu [.env.example](file:///d:/Desktop/AR-IMMS/.env.example):
```bash
cp .env.example .env
```

### 2. Khởi chạy Backend API & WebSocket Gateway Server
```bash
# Kích hoạt môi trường ảo Python
.\.venv\Scripts\Activate.ps1   # Trên Windows
source .venv/bin/activate      # Trên Linux/macOS

# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt

# Khởi chạy Backend Server
python backend/src/app.py
```
> Server sẽ chạy tại: `http://localhost:5000`  
> Health check endpoint: `http://localhost:5000/health`

### 3. Khởi chạy Collector Agent Daemon (Trên 4 Laptop thử nghiệm)
```bash
# Chuyển tới thư mục collector
cd collector

# Khởi chạy tiến trình Agent thu thập thông số phần cứng
python src/agent.py
```

---

## 📄 Biên dịch Tài liệu Đặc tả SRS (LaTeX)

Tài liệu SRS được soạn thảo theo chuẩn IEEE 830 bằng ngôn ngữ LaTeX mô-đun hóa trong thư mục `docs/SRS/`.

Để biên dịch ra tệp PDF hoàn chỉnh:
```bash
cd docs/SRS
pdflatex -interaction=nonstopmode SRS.tex
```
Kết quả bản PDF hoàn chỉnh (40 trang) sẽ được xuất tại: `docs/SRS/SRS.pdf`.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

- **Backend API & WebSocket:** Python 3.11+, Flask, SQLAlchemy, PyJWT, Flask-SocketIO, Eventlet/Threading
- **Data Collector Agent:** Python, `psutil`, `requests`, `python-socketio`, Docker SDK
- **Web Command Center:** Next.js 14, React, Tailwind CSS, Recharts, Socket.IO Client
- **Mobile AR Application:** React Native, Expo, ViroReact / ARCore, OpenCV / ArUco Marker Scanner
- **Database:** Supabase PostgreSQL Cloud (PostgreSQL 17.6) / SQLite Fallback
- **Documentation:** LaTeX (MiKTeX/TeXLive), Draw.io, Markdown IEEE 830 Standard

---

## 👥 Đơn vị Thực hiện

**Dự án:** AR-Integrated Infrastructure Monitoring and Maintenance System (AR-IMMS)  
**Trường:** Đại học Giao thông vận tải TP. Hồ Chí Minh (*University of Transport Ho Chi Minh City*)  
**Nhóm Thực hiện:** Thế Anh (Dev 1), Ngọc Ân (Dev 2), Thiện Nhân (Dev 3), Duy Khang (Dev 4)  
**Phiên bản:** 1.0.0 (Sprint 3 Final Update)

