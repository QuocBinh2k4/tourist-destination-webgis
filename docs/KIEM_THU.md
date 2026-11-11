# KẾ HOẠCH KIỂM THỬ HỆ THỐNG TOURISMGIS

## 1. Mục đích

Kiểm tra tính đúng đắn của các chức năng quản lý dữ liệu, truy vấn không gian, phân tích GIS và phân quyền người dùng.

## 2. Môi trường kiểm thử

- Hệ điều hành: Windows
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + PostGIS
- Bản đồ: React Leaflet
- Trình duyệt: Chrome hoặc Edge

*Ghi chính xác phiên bản phần mềm tại thời điểm thực nghiệm.*

## 3. Nội dung kiểm thử

### 3.1. Kiểm thử cơ sở dữ liệu

Kiểm tra khóa chính, khóa ngoại, ràng buộc dữ liệu, SRID và hình học không gian.

### 3.2. Kiểm thử chức năng quản lý

Thử nghiệm thêm, sửa, xóa, tìm kiếm và lọc dữ liệu du lịch, cơ sở dịch vụ, loại hình du lịch.

### 3.3. Kiểm thử chức năng GIS

Thử nghiệm tính khoảng cách, tìm điểm gần nhất, tìm trong bán kính, Buffer, đánh giá tiếp cận và phát hiện thiếu dịch vụ.

### 3.4. Kiểm thử bảo mật

Thử đăng nhập, đăng xuất, phiên hết hạn và các thao tác không đúng quyền.

## 4. Bảng kết quả

| Mã kiểm thử | Đầu vào | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|
| TC01 | Đăng nhập đúng | Thành công | Chưa kiểm thử | Chưa đánh giá |
| TC02 | Thêm điểm hợp lệ | Lưu vào PostGIS | Chưa kiểm thử | Chưa đánh giá |
| TC03 | Buffer 1000 m | Trả GeoJSON Polygon | Chưa kiểm thử | Chưa đánh giá |

## 5. Kết luận

Tổng hợp số ca kiểm thử đạt, không đạt, nguyên nhân lỗi, biện pháp khắc phục và kết quả kiểm thử lại.