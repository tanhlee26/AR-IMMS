# 🛡️ AR-IMMS (AR-Integrated Infrastructure Monitoring & Maintenance System)

> **Hệ thống Giám sát và Bảo trì Cơ sở Hạ tầng Trung tâm Dữ liệu Tích hợp Thực tế Tăng cường (Augmented Reality)**

Backend RESTful API được thiết kế và triển khai tuân theo nguyên lý **Clean Architecture** sử dụng **Flask (Python)**. Hệ thống cung cấp giải pháp toàn diện cho việc quản lý **Digital Twin 5 tầng**, tiếp nhận telemetry thời gian thực từ các agent, nhận diện node bị gián đoạn, tự động cảnh báo thông minh, tích hợp quét mã AR (ArUco/QR) hỗ trợ kỹ thuật viên hiện trường, quy trình quản lý sự cố (Ticket Lifecycle) và phân tích chỉ số hiệu quả năng lượng (PUE).

---

## 📑 Mục lục
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống (Clean Architecture)](#-kiến-trúc-hệ-thống-clean-architecture)
- [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
- [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [Tài khoản mặc định & Phân quyền (RBAC)](#-tài-khoản-mặc-định--phân-quyền-rbac)
- [Danh mục API Endpoints](#-danh-mục-api-endpoints)
- [Ứng dụng AR Mobile - Scannable Endpoints](#-ứng-dụng-ar-mobile---scannable-endpoints)
- [Hướng dẫn Chạy Unit Tests](#-hướng-dẫn-chạy-unit-tests)
- [Biến môi trường (.env)](#-biến-môi-trường-env)

---

## ✨ Tính năng chính

1. **Digital Twin 5 Tầng (Spatial Hierarchy)**
   - Quản lý không gian giám sát trung tâm dữ liệu theo hình cây 5 cấp: `Site` (Khu vực) $\rightarrow$ `Room` (Phòng máy) $\rightarrow$ `Rack` (Tủ máy chủ) $\rightarrow$ `Node` (Máy chủ vật lý) $\rightarrow$ `Container/Workload` (Ứng dụng).
   - Truy vấn toàn bộ mô hình Digital Twin bằng một API duy nhất.

2. **Tiếp nhận Telemetry & Giám sát Realtime**
   - Thu thập chỉ số từ các `DataCollectorAgent` (CPU, RAM, Nhiệt độ, Công suất tiêu thụ Power).
   - Tự động duy trì trạng thái kết nối agent qua heartbeat.

3. **Phát hiện Node quá hạn (Stale Node Detection)**
   - Tự động quét và phát hiện các Node quá 90 giây không gửi dữ liệu telemetry.
   - Chuyển trạng thái node sang `OFFLINE` và cập nhật agent tương ứng.

4. **Động cơ Cảnh báo & Chống bão cảnh báo (Alerting Engine & Duplicate Suppression)**
   - Cấu hình ngưỡng cảnh báo mềm (Warning) và ngưỡng nguy cấp (Critical) cho từng loại metric.
   - Tự động phát hiện vi phạm ngưỡng và tạo Alert.
   - **Chống bão cảnh báo**: Nếu đã có cảnh báo ở trạng thái `OPEN` cho cùng một node và metric type, hệ thống sẽ cập nhật mức độ nghiêm trọng mà không tạo các dòng ghi đè gây tràn CSDL.

5. **Tích hợp AR Marker (Augmented Reality Mobile Scanner)**
   - Liên kết vị trí vật lý của Node với mã định danh AR (`ArUco Marker` hoặc `QR Code`).
   - Cung cấp API quét mã `/api/v1/ar/scan/<marker_code>` trả về dữ liệu đa chiều (Spatial Coordinates + Realtime Metrics + Workloads + Cảnh báo active + Tickets hiện thời) hỗ trợ AR Mobile App hiển thị AR overlay trực tiếp trên thiết bị hiện trường.

6. **Vòng đời Quản lý Sự cố & Bảo trì (Ticket Lifecycle & Approval Workflow)**
   - Tạo ticket sự cố từ cảnh báo hoặc tạo thủ công.
   - Kỹ thuật viên (Technician) cập nhật tiến độ, ghi chú xử lý và gửi yêu cầu đóng ticket (`Closure Request`).
   - Quản trị viên vận hành (`System Operator`) duyệt đóng ticket (`Approve Closure`).
   - Khi ticket đóng thành công, thông tin được tự động kết xuất sang nhật ký bảo trì thiết bị vĩnh viễn (`MaintenanceHistory`).

7. **Báo cáo & Phân tích Chỉ số PUE (Analytics & Capacity)**
   - Tổng hợp sức khỏe hệ thống (Health Overview).
   - Phân tích PUE (Power Usage Effectiveness) của trung tâm dữ liệu.
   - Phân tích tải trọng điện năng tiêu thụ và dung lượng tủ Rack (Rack Capacity Utilization).

8. **Nhật ký Kiểm toán (Immutable Audit Logging)**
   - Tự động lưu vết tất cả các thao tác thay đổi cấu hình, tạo/đóng ticket, đăng nhập và phân quyền hệ thống.

---

## 🛠️ Công nghệ sử dụng

| Hạng mục | Công nghệ / Thư viện |
| :--- | :--- |
| **Language** | Python 3.10+ |
| **Web Framework** | Flask 2.3+ |
| **ORM / Database** | SQLAlchemy 2.0+, Flask-SQLAlchemy 3.0+ |
| **Database Engines** | PostgreSQL (Supabase) / SQLite |
| **Validation & Serialization** | Marshmallow 3.20+ |
| **Authentication & Authorization** | PyJWT (JWT Tokens), Werkzeug / Passlib Security |
| **API Documentation** | APISpec, Swagger UI (`flask-swagger-ui`) |
| **Cross-Origin Handling** | Flask-CORS |
| **Testing** | Python `unittest` |

---

## 🏛️ Kiến trúc Hệ thống (Clean Architecture)

Dự án áp dụng chặt chẽ kiến trúc **Clean Architecture** chia thành 4 lớp độc lập:

```text
               +----------------------------------+
               |   Presentation / API Layer       |
               |  (Controllers, Schemas, Swagger) |
               +----------------+-----------------+
                                |
                                v
               +----------------------------------+
               |   Application / Services Layer   |
               |     (Use Cases, Business Rules)  |
               +----------------+-----------------+
                                |
                                v
               +----------------------------------+
               |         Domain Layer             |
               |  (Entities, Models, Interfaces)  |
               +----------------+-----------------+
                                ^
                                |
               +----------------+-----------------+
               |    Infrastructure Layer          |
               |  (SQLAlchemy, DB Models, Repos)  |
               +----------------------------------+
```

1. **Presentation / API Layer (`src/api/`)**: Nhận HTTP request, validate dữ liệu đầu vào bằng Marshmallow, kiểm tra quyền JWT/RBAC qua Middleware, chuyển giao request cho Service và trả về response JSON chuẩn hóa.
2. **Services Layer (`src/services/`)**: Chứa toàn bộ logic nghiệp vụ (Use cases) của hệ thống như xử lý vòng đời ticket, kiểm tra Stale Node, lọc trùng cảnh báo, tính toán chỉ số PUE.
3. **Domain Layer (`src/domain/`)**: Chứa các khai báo Data Class nguyên bản (Pure Domain Models), các Exception tùy chỉnh và hằng số Enum. Không phụ thuộc vào bất kỳ framework bên ngoài nào.
4. **Infrastructure Layer (`src/infrastructure/`)**: Chứa các cấu hình CSDL, SQLAlchemy ORM Models (20 bảng CSDL) và triển khai cụ thể các Repository pattern.

---

## 📁 Cấu trúc Thư mục Dự án

```bash
Flask-CleanArchitecture/
├── .env                        # Biến môi trường (DB URL, JWT Secret...)
├── .gitignore                  # Cấu hình bỏ qua tệp tin Git
├── ERD.drawio                  # Sơ đồ quan hệ thực thể cơ sở dữ liệu (20 bảng)
├── README.md                   # Tài liệu hướng dẫn hệ thống
├── default.db                  # Cơ sở dữ liệu SQLite mặc định
├── src/                        # Thư mục mã nguồn chính
│   ├── api/                    # Lớp Presentation (REST Endpoints & Validation)
│   │   ├── controllers/        # Controllers xử lý HTTP Request
│   │   │   ├── alert_controller.py       # API Quản lý Cảnh báo & Ngưỡng
│   │   │   ├── ar_controller.py          # API Quản lý & Quét mã AR Marker
│   │   │   ├── asset_controller.py       # API Quản lý Tài sản & Bảo trì
│   │   │   ├── audit_controller.py       # API Nhật ký Kiểm toán (Audit Logs)
│   │   │   ├── auth_controller.py        # API Đăng nhập, Đăng ký & Người dùng
│   │   │   ├── hierarchy_controller.py   # API Mô hình Digital Twin (Sites, Rooms, Racks, Nodes)
│   │   │   ├── reporting_controller.py   # API Báo cáo Phân tích & PUE
│   │   │   ├── telemetry_controller.py   # API Nhận Telemetry & Heartbeat Agent
│   │   │   └── ticket_controller.py      # API Quản lý Sự cố & Vòng đời Ticket
│   │   ├── middleware.py       # JWT Guard & Phân quyền RBAC
│   │   ├── responses.py        # Chuẩn hóa JSON Response Formatter
│   │   ├── schemas/            # Schemas Marshmallow Validate Dữ liệu
│   │   └── swagger.py          # Cấu hình OpenAPI / Swagger Documentation
│   ├── domain/                 # Lớp Domain Core (Business Entities & Enums)
│   │   ├── constants.py        # Các hằng số Enum (Roles, Severities, Statuses...)
│   │   ├── exceptions.py       # Các lớp Ngoại lệ Domain
│   │   └── models/             # Dataclass Entities & Interface Repositories
│   ├── services/               # Lớp Services / Use Cases (Business Logic)
│   │   ├── alerting_service.py   # Xử lý Cảnh báo & Lọc trùng Alert
│   │   ├── ar_service.py         # Quét mã AR & Phân tích Tọa độ Không gian
│   │   ├── asset_service.py      # Quản lý Thông số Thiết bị & Bảo trì
│   │   ├── audit_service.py      # Lưu vết Audit Trail
│   │   ├── auth_service.py       # Đăng nhập, Tạo Token & Phân quyền User
│   │   ├── hierarchy_service.py  # Quản lý Mô hình Cây Digital Twin
│   │   ├── reporting_service.py  # Tính toán PUE & Tổng hợp Báo cáo
│   │   └── telemetry_service.py  # Tiếp nhận Metrics & Phát hiện Node Stale
│   ├── infrastructure/         # Lớp Infrastructure (Data Access & Storage)
│   │   ├── databases/          # Kết nối CSDL SQLAlchemy
│   │   ├── models/             # 20 SQLAlchemy ORM Models
│   │   └── repositories/       # Concrete Repository Implementation
│   ├── app.py                  # Flask Application Entrypoint & Server Startup
│   ├── config.py               # Quản lý Cấu hình Môi trường
│   ├── dependency_container.py # Dependency Injection (DI) Container
│   ├── seed.py                 # Kịch bản Khởi tạo & Phủ Dữ liệu Mẫu (DB Seeder)
│   └── requirements.txt        # Danh sách Thư viện Phụ thuộc Python
└── tests/                      # Thư mục Kiểm thử Tự động (Unit Tests)
    └── test_api.py             # Bộ Test API Endpoints & Business Workflows
```

---

## ⚡ Hướng dẫn Cài đặt & Khởi chạy

### 1. Kích hoạt Môi trường ảo (Virtual Environment)

**Trên Windows (PowerShell):**
```powershell
.venv\Scripts\activate.ps1
```

**Trên Linux / macOS:**
```bash
source .venv/bin/activate
```

### 2. Cài đặt các thư viện phụ thuộc
```bash
pip install -r src/requirements.txt
```

### 3. Khởi tạo Cơ sở Dữ liệu & Dữ liệu Mẫu (Seeder)
Chạy script `seed.py` để tự động tạo cấu trúc bảng và phủ dữ liệu mẫu (Sites, Rooms, Racks, Nodes, Workloads, Tài khoản mẫu, Mã AR ARUCO/QR...):
```bash
python src/seed.py
```

### 4. Khởi chạy Backend API Server
```bash
python src/app.py
```

Sau khi khởi chạy thành công, máy chủ backend sẽ chạy tại port `9999`:
- 🌐 **Swagger API Interactive Documentation**: [http://localhost:9999/docs](http://localhost:9999/docs)
- 📄 **OpenAPI JSON Specification**: [http://localhost:9999/swagger.json](http://localhost:9999/swagger.json)

---

## 🔑 Tài khoản Mặc định & Phân quyền (RBAC)

Hệ thống được khởi tạo sẵn 3 tài khoản thử nghiệm tương ứng với 3 vai trò trong mô hình quản lý:

| Username | Password | Role (Vai trò) | Mô tả & Quyền hạn |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin@123` | `ADMINISTRATOR` | Quản trị viên hệ thống. Toàn quyền cấu hình, quản lý người dùng, xem nhật ký kiểm toán. |
| `operator` | `Operator@123` | `SYSTEM_OPERATOR` | Vận hành viên hệ thống. Quản lý Digital Twin, thiết lập ngưỡng cảnh báo, phê duyệt đóng ticket. |
| `technician` | `Technician@123` | `TECHNICIAN` | Kỹ thuật viên hiện trường. Quét mã AR, cập nhật ghi chú sự cố, gửi yêu cầu đóng ticket. |

---

## 📋 Danh mục API Endpoints

### 🔑 1. Authentication & Users (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Đăng nhập hệ thống & lấy JWT Token.
- `GET /api/v1/auth/me`: Lấy thông tin tài khoản hiện tại.
- `GET /api/v1/auth/users`: Danh sách người dùng (Admin).
- `POST /api/v1/auth/users`: Tạo người dùng mới.

### 🏛️ 2. Digital Twin & Spatial Hierarchy (`/api/v1/hierarchy`)
- `GET /api/v1/hierarchy/digital-twin`: Lấy toàn bộ cây mô hình 5 tầng (Sites -> Rooms -> Racks -> Nodes -> Containers).
- `GET /api/v1/hierarchy/sites`: Danh sách Sites.
- `GET /api/v1/hierarchy/rooms`: Danh sách Rooms theo Site.
- `GET /api/v1/hierarchy/racks`: Danh sách Racks theo Room.
- `GET /api/v1/hierarchy/nodes`: Danh sách Nodes theo Rack.
- `POST /api/v1/hierarchy/nodes`: Khởi tạo Node máy chủ mới.

### 📱 3. AR Marker Scanning (`/api/v1/ar`)
- `GET /api/v1/ar/scan/<marker_code>`: Quét mã AR (ArUco / QR) và trả về dữ liệu tổng hợp overlay thời gian thực.
- `GET /api/v1/ar/markers`: Danh sách mã AR Markers đang liên kết với các Node.
- `POST /api/v1/ar/bind`: Gán mã AR Marker vào một Node máy chủ cụ thể.

### 📊 4. Telemetry & Agent Ingestion (`/api/v1/telemetry`, `/api/v1/agents`)
- `POST /api/v1/telemetry/ingest`: Tiếp nhận dữ liệu Telemetry (CPU, RAM, Temp, Power) từ Data Collector Agent.
- `GET /api/v1/telemetry/history`: Lấy lịch sử Telemetry của Node.
- `POST /api/v1/agents/heartbeat`: Gửi nhịp tim kết nối (Heartbeat) từ Agent.
- `POST /api/v1/telemetry/stale-check`: Chạy tác vụ kiểm tra các Node bị gián đoạn kết nối (>90s).

### 🚨 5. Alerting & Thresholds (`/api/v1/alerts`, `/api/v1/thresholds`)
- `GET /api/v1/alerts`: Danh sách cảnh báo hệ thống (Filter theo Status, Severity).
- `POST /api/v1/alerts/<id>/acknowledge`: Xác nhận đã ghi nhận cảnh báo.
- `GET /api/v1/thresholds`: Danh sách ngưỡng cảnh báo cấu hình.
- `POST /api/v1/thresholds`: Tạo/Cập nhật ngưỡng cảnh báo mới.

### 🎫 6. Incident & Ticket Lifecycle (`/api/v1/tickets`)
- `GET /api/v1/tickets`: Danh sách Ticket bảo trì/sự cố.
- `POST /api/v1/tickets`: Tạo Ticket mới.
- `POST /api/v1/tickets/<id>/notes`: Thêm ghi chú xử lý vào Ticket.
- `POST /api/v1/tickets/<id>/closure-request`: Kỹ thuật viên gửi yêu cầu đóng Ticket.
- `POST /api/v1/tickets/<id>/approve-closure`: System Operator phê duyệt/từ chối đóng Ticket.

### 📦 7. Asset & Warranty Management (`/api/v1/assets`)
- `GET /api/v1/assets/specs`: Thông số phần cứng thiết bị.
- `GET /api/v1/assets/warranty`: Thông tin bảo hành của nhà cung cấp.
- `GET /api/v1/assets/maintenance-history`: Lịch sử bảo trì thiết bị vĩnh viễn.

### 📈 8. Reporting & Analytics (`/api/v1/reports`)
- `GET /api/v1/reports/health`: Báo cáo tổng quan sức khỏe hệ thống.
- `GET /api/v1/reports/power-pue`: Chỉ số hiệu quả năng lượng PUE & Tiêu thụ điện năng.
- `GET /api/v1/reports/capacity`: Báo cáo dung lượng tủ Rack & mật độ thiết bị.

### 🛡️ 9. Audit Logs (`/api/v1/audit`)
- `GET /api/v1/audit/logs`: Nhật ký kiểm toán thao tác người dùng.

---

## 📱 Ứng dụng AR Mobile - Scannable Endpoints

Dành cho thiết bị di động AR (AR Glasses / Tablet / Smartphone):

Kỹ thuật viên quét nhãn dán ARUCO / QR dán trên thùng máy server:
- **API Endpoint**: `GET /api/v1/ar/scan/<marker_code>`
- **Các Mã AR mẫu sẵn có trong CSDL**:
  - `ARUCO-101` $\rightarrow$ Đính kèm với **Node-01 (Master)**
  - `ARUCO-102` $\rightarrow$ Đính kèm với **Node-02 (Worker A)**
  - `QR-NOD-03` $\rightarrow$ Đính kèm với **Node-03 (Worker B)**
  - `QR-NOD-04` $\rightarrow$ Đính kèm với **Node-04 (Database)**

---

## 🧪 Hướng dẫn Chạy Unit Tests

Bộ test tự động nằm tại `tests/test_api.py` bao phủ toàn bộ luồng nghiệp vụ end-to-end:

```bash
# Chạy bộ test tự động
python -m unittest tests/test_api.py
```

**Các kịch bản kiểm thử được tự động thực thi:**
- `test_01_login_and_auth`: Kiểm tra đăng nhập và cấp JWT Token cho 3 vai trò (Admin, Operator, Tech).
- `test_02_digital_twin_hierarchy`: Kiểm tra cấu trúc Digital Twin 5 tầng đầy đủ.
- `test_03_ar_marker_scanning`: Kiểm tra truy vấn thông tin AR Spatial Overlay qua mã ArUco/QR.
- `test_04_telemetry_ingestion_and_alerting`: Kiểm tra đẩy dữ liệu vượt ngưỡng và tự động tạo cảnh báo.
- `test_05_reporting_and_analytics`: Kiểm tra tính toán PUE và tổng quan sức khỏe hệ thống.
- `test_06_ticket_and_maintenance_lifecycle`: Kiểm tra quy trình khép kín: Tạo ticket $\rightarrow$ Thêm note $\rightarrow$ Yêu cầu đóng $\rightarrow$ Operator phê duyệt $\rightarrow$ Tự động ghi nhật ký bảo trì (`MaintenanceHistory`).

---

## ⚙️ Biến Môi trường (.env)

Tệp `.env` tại thư mục gốc của dự án cho phép tùy chỉnh cấu hình:

```env
# JWT Secret Key
SECRET_KEY=ar_imms_super_secret_jwt_key_2026

# Môi trường chạy (development / testing / production)
FLASK_ENV=development
DEBUG=True

# Cơ sở dữ liệu (Ưu tiên PostgreSQL, mặc định fallback SQLite nếu rỗng)
POSTGRES_DATABASE_URL=postgresql://user:password@host:5432/dbname

# Tham số hệ thống AR-IMMS
TELEMETRY_INTERVAL=5
STALE_TIMEOUT=90
```

---

<p align="center">
  <i>Được phát triển với phong cách Clean Architecture chuẩn mực & sẵn sàng cho tích hợp AR Data Center Management.</i>
</p>
