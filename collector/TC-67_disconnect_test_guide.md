# TC-67 [TSK-303] — Giả lập ngắt mạng 1 laptop để test lỗi "Unavailable > 90s"

Task này khác TC-68 (không thể làm hoàn toàn bằng code chạy nền, vì mục đích là
NGẮT chính kết nối mạng — cần thao tác ở tầng hệ điều hành/network adapter,
có yêu cầu quyền Admin). Dưới đây là script hỗ trợ tự động hoá tối đa + hướng dẫn thao tác thủ công dự phòng.

## Cách 1 — Tự động bằng script (Windows, cần quyền Admin)

Script dùng lệnh `netsh` để tắt/bật card mạng theo đúng thời gian định sẵn,
mô phỏng đúng kịch bản: mất tín hiệu > 90 giây rồi kết nối lại.

```powershell
# disconnect_test.ps1
# Chay PowerShell voi quyen Admin

$interfaceName = "Wi-Fi"   # doi neu ban dung Ethernet
$downtimeSeconds = 100     # >90s theo dung yeu cau task

Write-Host "[TEST] Tat card mang '$interfaceName' trong $downtimeSeconds giay..."
netsh interface set interface name="$interfaceName" admin=disable

Start-Sleep -Seconds $downtimeSeconds

Write-Host "[TEST] Bat lai card mang..."
netsh interface set interface name="$interfaceName" admin=enable

Write-Host "[TEST] Hoan tat. Kiem tra Web Command Center xem node co bao 'Unavailable' dung luc khong."
```

**Cách chạy:**
1. Lưu đoạn trên thành file `disconnect_test.ps1`
2. Mở PowerShell **as Administrator**
3. Chạy: `powershell -ExecutionPolicy Bypass -File disconnect_test.ps1`

## Cách 2 — Thủ công (nếu không muốn dùng script / máy chặn chạy script)

1. Vào **Settings → Network & Internet → Wi-Fi**, tắt Wi-Fi (hoặc rút dây LAN nếu dùng Ethernet)
2. Bấm giờ, chờ đúng **> 90 giây**
3. Bật lại Wi-Fi / cắm lại dây LAN
4. Kiểm tra trên Web Command Center (khi Dev 1 + Dev 3 xong phần hiển thị) xem node có được đánh dấu **"Unavailable"** đúng lúc mốc 90s không, và có tự phục hồi trạng thái khi kết nối lại không

## Lưu ý quan trọng
- Task này **phụ thuộc TSK-203** (WebSocket Client) và cơ chế phát hiện timeout phía Backend (Dev 1)
  phải đã hoạt động — nếu Backend chưa có logic "đánh dấu Unavailable sau 90s không nhận heartbeat"
  thì test này sẽ không có gì để quan sát (agent ngắt kết nối, nhưng backend không phản ứng).
- Trước khi test, đảm bảo Collector Agent (`collector_agent_ws.py`) đang chạy và gửi dữ liệu bình thường,
  để thấy rõ được sự chuyển trạng thái: Online → (mất kết nối) → Unavailable → (có mạng lại) → Online.
- Nên quay video / chụp màn hình lại quá trình test này để làm minh chứng nộp báo cáo (SRS/demo),
  vì đây là kịch bản test khó lặp lại y hệt nhiều lần.
