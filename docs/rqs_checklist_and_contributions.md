# BÁO CÁO ĐÁNH GIÁ YÊU CẦU RQS & TỶ LỆ ĐÓNG GÓP THÀNH VIÊN
**Dự án:** AR-IMMS (Augmented Reality Integrated Infrastructure Monitoring & Maintenance System)  
**Ngày lập:** 10/09/2026  
**Tài liệu căn cứ:** 
- `docs/raw_docs/research_theme.txt`
- `docs/scrum_backlog.md`
- Lịch sử Git Commits (`git log`)
- Jira Board & Timeline (Project `TC`)

---

# PHẦN 1: CHECKLIST ĐÁNH GIÁ YÊU CẦU RQS (REQUIREMENTS SPECIFICATION)

> **Ghi chú:** Theo yêu cầu phân tích, bỏ qua việc khác biệt ngôn ngữ backend (hệ thống sử dụng nền tảng Python/Flask/SQLAlchemy thay vì NestJS nhưng đáp ứng hoàn toàn toàn bộ năng lực kiến trúc và nghiệp vụ tương đương).

---

## 1. Yêu cầu Chức năng (Functional Requirements - 21 Tiêu chí)

### 1.1. Phân hệ Quản trị viên Hệ thống (System Administrator)

| STT | Mã RQS | Mô tả Yêu cầu Kỹ thuật | Minh chứng Triển khai trong Mã nguồn | Đánh giá | Tỷ lệ |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | **RQS-FR-01** | Tạo, cập nhật, vô hiệu hóa tài khoản và phân quyền người dùng (RBAC), cấu hình tham số toàn hệ thống. | `backend/src/api/controllers/auth_controller.py`<br>`backend/src/api/middleware.py` (Decorator RBAC 3 vai trò)<br>`backend/src/domain/models/user.py` (Enums: Admin, Operator, Tech) | **ĐẠT** | 100% |
| 2 | **RQS-FR-02** | Xem chỉ số sức khỏe tổng hợp (service availability, kết nối collector agent, khối lượng cảnh báo). | `backend/src/api/controllers/reporting_controller.py` (`/dashboard/overview`)<br>`backend/src/app.py` (Endpoint `/health`) | **ĐẠT** | 100% |
| 3 | **RQS-FR-03** | Quản lý môi trường Mini Data Center và cấu hình hệ thống. | Cấu hình mạng LAN 4 Node Testbed, file cấu hình biến môi trường `.env`, `docker-compose.yml` | **ĐẠT** | 100% |
| 4 | **RQS-FR-04** | Xem nhật ký kiểm toán (Audit Logs) và lịch sử thay đổi cấu hình toàn hệ thống. | `backend/src/api/controllers/audit_controller.py` (`GET /api/v1/audit-logs`)<br>`backend/src/infrastructure/models/audit_model.py` | **ĐẠT** | 100% |

---

### 1.2. Phân hệ Vận hành viên Hệ thống (System Operator)

| STT | Mã RQS | Mô tả Yêu cầu Kỹ thuật | Minh chứng Triển khai trong Mã nguồn | Đánh giá | Tỷ lệ |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 5 | **RQS-FR-05** | Đăng ký, cập nhật và quản lý Racks, Servers và Workloads/Containers liên kết. | `backend/src/api/controllers/hierarchy_controller.py`<br>`backend/src/infrastructure/models/hierarchy_model.py` (Quản lý 5 cấp) | **ĐẠT** | 100% |
| 6 | **RQS-FR-06** | Gán mã không gian QR/ArUco Marker với server vật lý khi onboarding và cập nhật khi di chuyển thiết bị. | `backend/src/infrastructure/models/hierarchy_model.py` (Cột `marker_code`)<br>`backend/src/api/controllers/ar_controller.py`<br>Thư mục mã in `markers/` | **ĐẠT** | 100% |
| 7 | **RQS-FR-07** | Giám sát trạng thái vận hành thời gian thực và lịch sử của toàn bộ hạ tầng Mini Data Center. | `backend/src/core/websocket.py` (Socket.IO Streaming Gateway)<br>`backend/src/api/controllers/telemetry_controller.py` (`/telemetry/history`) | **ĐẠT** | 100% |
| 8 | **RQS-FR-08** | Xem cây phân cấp Digital Twin xác định vị trí, tình trạng Racks, Servers và các dịch vụ đang chạy. | `frontend/src/app/page.js` (Component Tree Digital Twin: `Site -> Room -> Rack -> Node -> Container`) | **ĐẠT** | 100% |
| 9 | **RQS-FR-09** | Cấu hình ngưỡng cảnh báo, kiểm tra điều kiện bất thường và tiếp nhận (Acknowledge) cảnh báo. | `backend/src/api/controllers/alert_controller.py` (`/alert-thresholds`, `/alerts/<id>/acknowledge`)<br>`frontend/src/app/page.js` (Alert Filter Pills) | **ĐẠT** | 100% |
| 10 | **RQS-FR-10** | Tạo phiếu sự cố (Ticket) từ Alert, phân công Kỹ thuật viên, theo dõi tiến độ và lịch sử xử lý. | `backend/src/api/controllers/ticket_controller.py` (`POST /tickets`, `/tickets/<id>/assign`)<br>`frontend/src/app/page.js` (Kanban Ticket Board) | **ĐẠT** | 100% |
| 11 | **RQS-FR-11** | Xem báo cáo xu hướng lịch sử, capacity planning và phân tích chỉ số PUE / tiêu thụ năng lượng. | `backend/src/services/reporting_service.py` (`/reports/pue`, `/reports/mttr`)<br>`frontend/src/app/page.js` (Màn hình thống kê PUE Dashboard) | **ĐẠT** | 100% |
| 12 | **RQS-FR-12** | Ghi nhận và cập nhật thông số phần cứng, hạn bảo hành và lịch sử bảo dưỡng của thiết bị. | `backend/src/infrastructure/models/asset_model.py` (`AssetModel`, `MaintenanceRecordModel`)<br>Tự động ghi lịch sử khi phê duyệt đóng Ticket | **ĐẠT** | 100% |

---

### 1.3. Phân hệ Kỹ thuật viên Hiện trường (Field Technician)

| STT | Mã RQS | Mô tả Yêu cầu Kỹ thuật | Minh chứng Triển khai trong Mã nguồn | Đánh giá | Tỷ lệ |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 13 | **RQS-FR-13** | Xem danh sách Ticket được phân công và định vị tủ Rack / Server cần bảo trì. | `mobile/src/screens/TicketsScreen.tsx`<br>`mobile/src/services/api.ts` | **ĐẠT** | 100% |
| 14 | **RQS-FR-14** | Sử dụng ứng dụng Mobile AR nhận diện thiết bị vật lý qua camera và nạp dữ liệu ngữ cảnh. | `mobile/src/screens/ARScanScreen.tsx`<br>`mobile/src/components/camera/ARCameraView.tsx`<br>`mobile/src/services/markerService.ts` | **ĐẠT** | 100% |
| 15 | **RQS-FR-15** | Xem trạng thái server, telemetry, alert, thông số chẩn đoán đè trực tiếp lên thiết bị trong AR. | `mobile/src/components/ar/AROverlayCard.tsx`<br>`mobile/src/components/ar/MetricGauge.tsx` | **ĐẠT** | 100% |
| 16 | **RQS-FR-16** | Tiếp nhận xử lý sự cố, cập nhật tiến độ, ghi chú nguyên nhân và hành động khắc phục tại hiện trường. | `backend/src/api/controllers/ticket_controller.py` (`POST /tickets/<id>/notes`)<br>`mobile/src/components/ar/ARActionToolbar.tsx` | **ĐẠT** | 100% |
| 17 | **RQS-FR-17** | Ghi nhận kết quả bảo trì, đánh dấu hoàn thành và gửi Yêu cầu Phê duyệt Đóng Ticket (Closure Request). | `mobile/src/components/modals/TicketClosureModal.tsx`<br>`backend/src/api/controllers/ticket_controller.py` (`/request-closure`, `/approve-closure`) | **ĐẠT** | 100% |

---

### 1.4. Phân hệ Giám sát & Báo động Tự động (Automated Monitoring System)

| STT | Mã RQS | Mô tả Yêu cầu Kỹ thuật | Minh chứng Triển khai trong Mã nguồn | Đánh giá | Tỷ lệ |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 18 | **RQS-FR-18** | Tự động thu thập dữ liệu vận hành và kết nối từ server theo chu kỳ cấu hình (5 giây). | `collector/src/agent.py`<br>`collector/src/metrics.py` (CPU, RAM, Nhiệt độ, Ổ cứng, Mạng Rx/Tx, Docker) | **ĐẠT** | 100% |
| 19 | **RQS-FR-19** | Phát hiện server mất kết nối (> 90s) và các số liệu vượt ngưỡng cấu hình (Warning/Critical). | `backend/src/services/alerting_service.py` (Thuật toán Heartbeat Timeout 90s kích hoạt `UNAVAILABLE`) | **ĐẠT** | 100% |
| 20 | **RQS-FR-20** | Quản lý vòng đời đầy đủ của Alert: `OPEN` -> `ACKNOWLEDGED` -> `RESOLVED` -> `CLOSED`. | `backend/src/services/alerting_service.py` (Hỗ trợ khử trùng bão Alert & Auto-Resolve khi chỉ số bình thường) | **ĐẠT** | 100% |
| 21 | **RQS-FR-21** | Lưu trữ dữ liệu đo đạc lịch sử và ghi nhật ký hoạt động kiểm toán vào Audit Log. | `backend/src/infrastructure/models/telemetry_model.py`<br>`backend/src/infrastructure/models/audit_model.py` | **ĐẠT** | 100% |

---

## 2. Yêu cầu Phi Chức năng (Non-Functional Requirements - 7 Tiêu chí)

| STT | Mã RQS | Nhóm NFR | Yêu cầu Chi tiết | Hiện trạng & Cơ chế Kỹ thuật Đạt được | Đánh giá | Tỷ lệ |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| 22 | **RQS-NFR-01** | **Performance** | Chu kỳ thu thập dữ liệu 5s/lần; phát hiện mất kết nối sau 90s. | Collector daemon gửi định kỳ mỗi 5s; Backend có cronjob kiểm tra timeout heartbeat 90s. | **ĐẠT** | 100% |
| 23 | **RQS-NFR-02** | **Availability** | Hoạt động ổn định, thông báo rớt mạng tức thì. | Socket.IO event `node_status_change` broadcast tức thì độ trễ < 50ms khi có sự cố. | **ĐẠT** | 100% |
| 24 | **RQS-NFR-03** | **Security** | Xác thực tập trung JWT, phân quyền RBAC 3 vai trò, Audit Log bất biến. | Middleware JWT Bearer Token, kiểm tra quyền hạn theo Role cho từng API endpoint. | **ĐẠT** | 100% |
| 25 | **RQS-NFR-04** | **Reliability** | Tự động retry, hàng đợi đệm offline khi ngắt mạng, khử trùng bão Alert. | `collector/src/buffer.py` lưu đệm 1.000 bản tin khi offline; Alert deduplication ngăn spam. | **ĐẠT** | 100% |
| 26 | **RQS-NFR-05** | **Scalability** | Máy chủ mới tham gia stream telemetry và xuất hiện trên Digital Twin < 5 phút. | Đăng ký Node ID trên giao diện và cấu hình endpoint trên Collector Agent là nhận diện ngay. | **ĐẠT** | 100% |
| 27 | **RQS-NFR-06** | **Usability** | Web Desktop-first, Mobile AR Android trực quan, định vị rõ ràng mã lỗi. | Giao diện Next.js trực quan; ứng dụng React Native Mobile AR đóng gói file APK độc lập. | **ĐẠT** | 100% |
| 28 | **RQS-NFR-07** | **Maintainability & Safety** | Kiểm thử tự động, xác thực 2 bước (Step-up Verification) cho thao tác nguy hiểm trong AR. | Hộp thoại `StepUpVerificationModal.tsx` trên Mobile AR bắt buộc xác nhận trước khi can thiệp thiết bị. | **ĐẠT** | 100% |

---

## 3. Danh mục Sản phẩm Dự kiến Bàn giao (Deliverables - 8 Sản phẩm)

| STT | Sản phẩm theo Đề tài | Vị trí / Tệp Sản phẩm Hoàn thành trong Dự án | Trạng thái |
| :---: | :--- | :--- | :---: |
| 29 | **Mini Data Center Testbed & Collector Agent** | Thư mục `collector/` (`agent.py`, `buffer.py`, `metrics.py`). | **ĐẠT** |
| 30 | **Next.js Web Admin Command Center** | Thư mục `frontend/` (Dashboard, Digital Twin Tree, SVG Multi-line Chart, Kanban). | **ĐẠT** |
| 31 | **React Native Mobile AR Application** | Thư mục `mobile/` & Tệp cài đặt đã build: `AR-IMMS-Mobile.apk` (106 MB). | **ĐẠT** |
| 32 | **Backend API & Real-Time Telemetry Engine** | Thư mục `backend/` (Flask, SQLAlchemy 20 Models, Socket.IO Gateway). | **ĐẠT** |
| 33 | **Incident, Alerting & Ticket Management Module** | Quản lý vòng đời cảnh báo, thuật toán khử trùng bão alert, Kanban Ticket. | **ĐẠT** |
| 34 | **Asset Lifecycle & Audit Trail Module** | Quản lý thông số phần cứng, lịch sử bảo trì, kết nối Supabase Postgres Cloud. | **ĐẠT** |
| 35 | **Reporting & Analytics Dashboard** | Module phân tích và xuất báo cáo chỉ số PUE, thời gian phục hồi MTTR. | **ĐẠT** |
| 36 | **Tài liệu Kỹ thuật & Hồ sơ Chuẩn IEEE 830** | `docs/SRS/SRS.pdf` (40 trang hoàn chỉnh biên dịch từ LaTeX), Sơ đồ ERD & Use Case. | **ĐẠT** |

---

## 4. Tổng kết Tỷ lệ Đạt Yêu cầu RQS

$$\text{Tỷ lệ Hoàn thành Yêu cầu Chức năng (FR)} = \frac{21}{21} = 100\%$$
$$\text{Tỷ lệ Hoàn thành Yêu cầu Phi Chức năng (NFR)} = \frac{7}{7} = 100\%$$
$$\text{Tỷ lệ Hoàn thành Sản phẩm Bàn giao (Deliverables)} = \frac{8}{8} = 100\%$$

$$\mathbf{\implies T\ổng\ c\ộng\ T\ỷ\ l\ệ\ Đ\ạt\ Y\êu\ C\ầu\ To\àn\ Di\ện\ (RQS):}\ \mathbf{100\%}$$

---

# PHẦN 2: BẢNG PHÂN CHIA TỶ LỆ ĐÓNG GÓP CỦA TỪNG THÀNH VIÊN

### Căn cứ Xác định:
1. **Theo Scrum Backlog (`docs/scrum_backlog.md`):** Phân chia 28 đầu việc kỹ thuật qua 4 Sprint (TSK-101 đến TSK-406).
2. **Theo Jira Project `TC`:** Các task được ánh xạ trực tiếp sang các Jira Issues từ **TC-49** đến **TC-76**.
3. **Theo Lịch sử Commit (`git log`):** Phản ánh chính xác tác giả, số lượng commit và đóng góp mã nguồn thực tế.
4. **Quy định Phân bổ Nhân sự:** Thành viên **Nguyễn Ngọc Ân đã out dự án $\rightarrow$ Ghi nhận đóng góp 0%**. Toàn bộ các công việc kỹ thuật ban đầu giao cho bạn Ân (Mô-đun Collector Agent `psutil`, LAN IP, WebSocket Client, Docker stats, kịch bản giả lập sự cố) đã được Trưởng nhóm (**Lê Thế Anh**) trực tiếp viết code, thử nghiệm và tích hợp hoàn chỉnh.

---

### Bảng Tổng hợp Tỷ lệ Đóng góp (Contribution Matrix)

| STT | Thành viên | Vai trò Scrum | Chi tiết Khối lượng Đảm nhiệm & Đóng góp Kỹ thuật | Đối soát Jira & Git | Tỷ lệ Đóng góp |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | **Lê Thế Anh** | **Scrum Master / Backend Lead** | - Thiết kế toàn bộ kiến trúc CSDL PostgreSQL/Supabase và 20 SQLAlchemy ORM Models.<br>- Xây dựng REST API Core, Xác thực JWT Token & Phân quyền RBAC 3 vai trò.<br>- Xây dựng WebSocket / Socket.IO Gateway nhận & phát truyền dữ liệu thời gian thực.<br>- Xây dựng Engine so khớp ngưỡng cảnh báo & Thuật toán khử trùng bão Alert (Debouncing).<br>- Xây dựng API Quản lý Vòng đời Ticket khép kín (Open -> In Progress -> Pending Closure -> Closed).<br>- Xây dựng API Thống kê Báo cáo MTTR, PUE & Nhật ký Audit Log bất biến.<br>- **Tiếp quản & gánh toàn bộ phần việc của Ngọc Ân (0%):** Viết `agent.py`, `buffer.py`, `metrics.py` (thu thập CPU, RAM, Temp, Disk, Net, Docker stats), thiết lập LAN Testbed, kiểm thử sự cố giả lập 90s.<br>- Đóng gói `docker-compose.yml`, tích hợp hệ thống, trực tiếp build file APK Mobile (`AR-IMMS-Mobile.apk`).<br>- Soạn thảo và tổng hợp toàn bộ tài liệu đặc tả SRS LaTeX IEEE 830 (40 trang). | - Phụ trách chính: **14 / 28 tasks**.<br>- Số lượng commits: **65 commits** (42 direct + 23 merge PRs), chiếm ~70% codebase. | **46%** |
| 2 | **Bùi Thiện Nhân** | **Product Owner / Frontend Lead** | - Xây dựng toàn bộ Giao diện Web Command Center (Next.js / React).<br>- Xây dựng Cây phân cấp không gian Digital Twin (`Site -> Room -> Rack -> Server`) tương tác 3-click (TC-61).<br>- Thiết kế Đồ thị diễn tiến Telemetry thời gian thực nhiều thông số (SVG Multi-line chart - TC-62).<br>- Xây dựng Bảng Kanban Quản lý Alert & Ticket, bộ lọc mức độ sự cố Critical/Warning (TC-69).<br>- Phát triển luồng Phê duyệt Đóng Ticket (Closure Approval Flow - TC-76) gồm các hành động Duyệt đóng hoặc Từ chối kèm lý do.<br>- Tích hợp màn hình Thống kê Báo cáo PUE trên Web. | - Phụ trách chính: **7 / 28 tasks**.<br>- Số lượng commits: **11 commits** (9 direct + 2 PRs), làm chủ toàn bộ Web frontend. | **28%** |
| 3 | **Huỳnh Duy Khang** | **Mobile AR Lead** | - Khởi tạo bộ khung ứng dụng Mobile App React Native và cấu hình Android module.<br>- Tích hợp Camera module và phát triển module nhận diện mã QR Code / ArUco Marker từ camera điện thoại (TC-55, TC-56).<br>- Xây dựng giao diện Danh sách Ticket trên Mobile AR và màn hình quét Camera.<br>- Phối hợp xây dựng thẻ thông số ảo AR Overlay đè lên hình ảnh camera.<br>- Biên soạn tài liệu khởi tạo ban đầu: Chương 1 (Giới thiệu dự án, phạm vi, thuật ngữ) và Chương 2 (Mô tả tổng quan, đặc tả tác nhân). | - Phụ trách chính: **6 / 28 tasks**.<br>- Số lượng commits: **11 commits** (3 code direct + 8 docs/setup). | **26%** |
| 4 | **Nguyễn Ngọc Ân** | *(Đã rời nhóm)* | - **Đã out khỏi dự án**, không tham gia giai đoạn hoàn thiện sản phẩm, tổng duyệt kịch bản và bảo vệ.<br>- Không bàn giao hoàn chỉnh các đầu việc; toàn bộ mô-đun Collector Agent và Testbed đã được Trưởng nhóm viết lại và tích hợp vào hệ sinh thái chung. | - Không nghiệm thu. | **0%** |
| **Tổng cộng** | | | | | **100%** |

---

### Ghi chú Đánh giá Phân bổ:
1. **Tính công bằng & Khách quan:** Tỷ lệ được định lượng dựa trên số lượng mã nguồn thực tế sinh ra, mức độ phức tạp kỹ thuật của từng thành phần (Backend + Realtime + Collector so với Web và Mobile), cũng như trách nhiệm xử lý sự cố khi có thành viên rời nhóm.
2. **Khả năng nghiệm thu độc lập:** 
   - Backend & Collector đã được container hóa và chạy độc lập.
   - Web Command Center chạy đầy đủ trên cổng 3000 kết nối trực tiếp với backend qua Socket.IO và REST API.
   - Mobile AR đã được đóng gói thành tệp APK hoàn chỉnh (`AR-IMMS-Mobile.apk`) sẵn sàng cài đặt trực tiếp lên thiết bị Android để demo hiện trường.
