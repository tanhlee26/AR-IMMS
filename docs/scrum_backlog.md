# Kế hoạch Quản lý Dự án Agile/Scrum (4 Tuần) - Dự án AR-IMMS

## 📋 Bối cảnh & Điều kiện Thực nghiệm (Demo Constraints)
- **Quy mô nhóm:** 04 thành viên.
- **Thời gian:** 04 tuần (4 Sprints, 1 tuần / 1 Sprint).
- **Mô hình Demo (Mini Data Center Testbed):** 
  - 04 Laptop đóng vai trò 04 Server/Node thuộc các tủ Rack.
  - 01 Điện thoại Android chạy ứng dụng Mobile AR để quét mã QR/ArUco dán phía trước laptop.
  - 01 Máy tính làm Web Command Center (Chỉ huy vận hành).

---

## 👥 Phân công Vai trò Scrum (Roles & Responsibilities)

| Thành viên | Vai trò Scrum | Phân công Kỹ thuật Chính (Technical Ownership) |
| :--- | :--- | :--- |
| **Thành viên 1 (Dev 1)** | **Scrum Master / Backend Lead** | Backend API (Flask/NestJS), CSDL (Postgres), Xác thực JWT/RBAC, WebSocket Gateway, Engine Cảnh báo & Ticket, Docker Compose. |
| **Thành viên 2 (Dev 2)** | **Testbed & Collector Lead** | Dựng mạng LAN 4 Laptop, viết Collector Agent (`psutil`, Docker stats), mTLS/WebSocket Client, thiết kế & gán mã QR/ArUco physical markers. |
| **Thành viên 3 (Dev 3)** | **Product Owner / Frontend Lead** | Web Command Center (Next.js/React), Trực quan hóa Digital Twin Tree, Đồ thị Telemetry thời gian thực, Bảng quản lý Alert/Ticket, Báo cáo PUE. |
| **Thành viên 4 (Dev 4)** | **Mobile AR Lead** | Mobile AR Application (React Native Android), Nhận diện mã QR/ArUco (Computer Vision), Hiển thị lớp phủ AR Overlay thời gian thực, Step-up Verification. |

---

## 🗺️ Ma trận Phụ thuộc & Nguyên tắc Ưu tiên (Dependency Rules)

```
[Mức 1: Ít phụ thuộc - LÀM TRƯỚC (Sprint 1)]
  ├─ Dev 1: DB Schema + REST API Core
  ├─ Dev 2: Collector Agent cơ bản (Đọc CPU/RAM/Disk local)
  ├─ Dev 3: Khung Web Dashboard (Layout, Login UI)
  └─ Dev 4: Khung Mobile App + Camera Scan QR

[Mức 2: Phụ thuộc Trung bình - LÀM SONG SONG / THEO HÀNG ĐỢI (Sprint 2)]
  ├─ Dev 2 ──(đẩy WS)──> Dev 1 (WebSocket Gateway)
  ├─ Dev 1 ──(broadcast WS)──> Dev 3 (Vẽ biểu đồ + Digital Twin)
  └─ Dev 4 ──(quét QR + gọi API)──> Dev 1 (Lấy dữ liệu hiển thị AR Overlay)

[Mức 3: Phụ thuộc Cao - TÍCH HỢP & NGHIỆM THU (Sprint 3 & 4)]
  ├─ Logic Cảnh báo & Ticket (Dev 1 + Dev 3 + Dev 4)
  └─ Kịch bản giả lập sự cố 4 Laptop Demo (Dev 2 + Cả nhóm)
```

---

## 📅 Product Backlog & Chi tiết 4 Sprints (Timeline 4 Tuần)

### SPRINT 1 (Tuần 1): Khởi tạo Nền tảng Core, CSDL & Nhận diện Mã
**Mục tiêu Sprint:** Dựng xong CSDL, Backend API Auth, Agent đọc chỉ số 4 laptop, Web/Mobile sẵn sàng khung.

| Mã Task | Tên Nhiệm vụ (Task Name) | Người làm | Ưu tiên | Phụ thuộc | Thời gian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-101** | Thiết kế CSDL Postgres (15 thực thể ERD) \& SQLAlchemy ORM Models | Dev 1 | **High** | Khai phá | 2 ngày |
| **TSK-102** | Xây dựng API Đăng nhập JWT Token \& Phân quyền RBAC | Dev 1 | **High** | TSK-101 | 2 ngày |
| **TSK-103** | Khởi tạo cấu trúc phân cấp Hạ tầng (Site, Room, Rack, Node) | Dev 1 | **Medium** | TSK-101 | 1 ngày |
| **TSK-104** | Viết script Collector Agent đọc chỉ số CPU, RAM, Disk bằng `psutil` | Dev 2 | **High** | Độc lập | 2 ngày |
| **TSK-105** | Thiết lập kết nối mạng LAN giữa 4 Laptop Testbed & đặt IP tĩnh | Dev 2 | **High** | Độc lập | 1 ngày |
| **TSK-106** | Tạo mã QR Code & ArUco Marker duy nhất dán lên 4 Laptop | Dev 2 | **Medium** | TSK-105 | 1 ngày |
| **TSK-107** | Dựng khung Web Next.js, Router, Layout & Màn hình Đăng nhập | Dev 3 | **High** | Độc lập | 2 ngày |
| **TSK-108** | Dựng khung Mobile App React Native, tích hợp Camera module | Dev 4 | **High** | Độc lập | 2 ngày |
| **TSK-109** | Xây dựng module nhận diện mã QR/ArUco từ camera di động | Dev 4 | **High** | TSK-108 | 2 ngày |

---

### SPRINT 2 (Tuần 2): Telemetry Streaming, Digital Twin & AR Overlay
**Mục tiêu Sprint:** Agent gửi telemetry 5s/lần về Backend $\rightarrow$ Web hiển thị đồ thị \& Digital Twin, App quét QR hiện AR Overlay thành công trên 4 laptop.

| Mã Task | Tên Nhiệm vụ (Task Name) | Người làm | Ưu tiên | Phụ thuộc | Thời gian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-201** | Xây dựng WebSocket / Socket.IO Gateway nhận & phát truyền dữ liệu | Dev 1 | **High** | TSK-102 | 2 ngày |
| **TSK-202** | Xây dựng API trích xuất thông số thời gian thực theo Node ID | Dev 1 | **High** | TSK-201 | 1 ngày |
| **TSK-203** | Tích hợp Client WebSocket vào Agent gửi dữ liệu 5s/lần về Backend | Dev 2 | **High** | TSK-201 | 2 ngày |
| **TSK-204** | Viết module thu thập Docker Container stats trên các laptop | Dev 2 | **Medium** | TSK-104 | 2 ngày |
| **TSK-205** | Giao diện Cây phân cấp Digital Twin ($\text{Site} \rightarrow \text{Room} \rightarrow \text{Rack} \rightarrow \text{Server}$) | Dev 3 | **High** | TSK-103 | 2 ngày |
| **TSK-206** | Vẽ đồ thị diễn biến Telemetry thời gian thực (CPU/RAM/Temp) | Dev 3 | **High** | TSK-201 | 2 ngày |
| **TSK-207** | Tích hợp API gọi dữ liệu theo ID mã QR trên app Mobile AR | Dev 4 | **High** | TSK-109, 202 | 2 ngày |
| **TSK-208** | Hiển thị thẻ thông số ảo (AR Overlay: CPU, RAM, Temp) đè lên camera | Dev 4 | **High** | TSK-207 | 2 ngày |

---

### SPRINT 3 (Tuần 3): Phát hiện Cảnh báo, Quản lý Ticket & Thao tác AR
**Mục tiêu Sprint:** Tự động báo lỗi CPU $> 90\%$ / Mất mạng $> 90\text{s}$, tạo Alert, phân công Ticket và thao tác nghiệm thu trên AR.

| Mã Task | Tên Nhiệm vụ (Task Name) | Người làm | Ưu tiên | Phụ thuộc | Thời gian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-301** | Xây dựng Engine so sánh ngưỡng Cảnh báo & Thuật toán khử trùng bão Alert | Dev 1 | **High** | TSK-201 | 2 ngày |
| **TSK-302** | Xây dựng API Quản lý Vòng đời Ticket (Open $\rightarrow$ Assigned $\rightarrow$ Closure) | Dev 1 | **High** | TSK-301 | 2 ngày |
| **TSK-303** | Giả lập sự cố: Ngắt mạng 1 laptop để test lỗi *Unavailable* $> 90\text{s}$ | Dev 2 | **High** | TSK-203 | 1 ngày |
| **TSK-304** | Giả lập sự cố: Chạy script stress test CPU trên laptop để test lỗi *Critical* | Dev 2 | **High** | TSK-203 | 1 ngày |
| **TSK-305** | Màn hình Quản lý Alert & Ticket trên Web (Xác nhận, Phân công Tech) | Dev 3 | **High** | TSK-302 | 2 ngày |
| **TSK-306** | Màn hình Duyệt đóng Ticket (Closure Approval) trên Web Command Center | Dev 3 | **Medium** | TSK-305 | 1 ngày |
| **TSK-307** | Màn hình danh sách Ticket được giao & Thông báo đẩy trên App Mobile AR | Dev 4 | **High** | TSK-302 | 2 ngày |
| **TSK-308** | Nút bấm thao tác xử lý & Xác thực 2 bước (Step-up Verification) trong AR | Dev 4 | **High** | TSK-208, 307 | 2 ngày |

---

### SPRINT 4 (Tuần 4): Thống kê PUE, Đóng gói Docker & Tổng duyệt Kịch bản Demo
**Mục tiêu Sprint:** Hoàn thiện báo cáo, Audit Log, Docker hóa hệ thống và diễn tập kịch bản demo 15 phút trên 4 laptop.

| Mã Task | Tên Nhiệm vụ (Task Name) | Người làm | Ưu tiên | Phụ thuộc | Thời gian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-401** | Xây dựng API Báo cáo Thống kê MTTR, PUE & Nhật ký Audit Log bất biến | Dev 1 | **High** | TSK-302 | 2 ngày |
| **TSK-402** | Đóng gói toàn bộ Backend & DB bằng `docker-compose.yml` | Dev 1 | **High** | TSK-201 | 1 ngày |
| **TSK-403** | Chuẩn hóa vị trí dán mã QR/ArUco, góc chiếu camera & ánh sáng 4 laptop | Dev 2 | **High** | TSK-106 | 1 ngày |
| **TSK-404** | Màn hình Báo cáo Thống kê PUE & Xuất báo cáo PDF/Excel trên Web | Dev 3 | **Medium** | TSK-401 | 2 ngày |
| **TSK-405** | Tối ưu độ trễ hiển thị thẻ AR Overlay ($< 1\text{s}$) và mượt mà khi di chuyển | Dev 4 | **High** | TSK-208 | 2 ngày |
| **TSK-406** | **TỔNG DUYỆT DEMO KỊCH BẢN 15 PHÚT** (Giả lập sự cố 4 laptop $\rightarrow$ Web báo lỗi $\rightarrow$ Tech cầm điện thoại quét AR $\rightarrow$ Sửa lỗi $\rightarrow$ Đóng ticket) | **Cả 4 người** | **Critical** | Tất cả | 2 ngày |

---

## 🎬 Kịch bản Chạy Demo Báo cáo Cuối kỳ (15 Phút)

1. **Phút 01 - 03 (Giới thiệu chung):**
   - Trình chiếu Web Command Center hiển thị 4 nút Máy chủ (đại diện 4 Laptop) trên sơ đồ cây Digital Twin. Tất cả 4 laptop đều báo màu Xanh (Healthy).
2. **Phút 03 - 06 (Giả lập Sự cố 1 - Vượt ngưỡng CPU):**
   - Dev 2 bật script stress test trên **Laptop 2**.
   - Sau 5s, Web Command Center đổi màu Laptop 2 thành **Màu Đỏ (Critical)** và hiển thị Alert cảnh báo CPU $> 90\%$.
   - Dev 3 (Operator) nhấn **Xác nhận (Acknowledge)** và giao Ticket cho Dev 4 (Technician).
3. **Phút 06 - 10 (Thực hiện Sửa chữa bằng AR tại hiện trường):**
   - Dev 4 cầm điện thoại Android mở app AR, di chuyển tới trước **Laptop 2** và quét mã QR dán phía trước vỏ máy.
   - Màn hình camera hiển thị ngay lớp phủ AR Overlay báo lỗi CPU $95\%$ màu đỏ.
   - Dev 4 bấm nút "Tắt tiến trình rác" trên màn hình AR $\rightarrow$ App hiện hộp thoại **Xác thực 2 bước (Step-up Verification)**. Dev 4 bấm đồng ý.
   - Script stress test trên Laptop 2 bị ngắt, CPU hạ xuống $15\%$. Thẻ AR trên camera tự động chuyển sang **Màu Xanh**. Dev 4 bấm "Gửi yêu cầu đóng Ticket".
4. **Phút 10 - 13 (Giả lập Sự cố 2 - Mất mạng):**
   - Dev 2 rút dây mạng/ngắt Wi-Fi **Laptop 4**.
   - Sau 90s, hệ thống phát hiện mất heartbeat, Web chuyển Laptop 4 sang **Màu Xám (Unavailable)**.
5. **Phút 13 - 15 (Nghiệm thu & Báo cáo):**
   - Operator phê duyệt đóng Ticket.
   - Mở màn hình Báo cáo PUE và nhật ký **Audit Log** ghi nhận vĩnh viễn vết sự cố đã được xử lý.

