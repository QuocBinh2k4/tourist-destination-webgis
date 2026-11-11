# Dữ liệu du lịch miền Bắc

Đã bổ sung 24 điểm tham quan và 18 cơ sở phục vụ du lịch vào CSDL `tourismgis`.
Dữ liệu bao phủ Hà Nội, Ninh Bình, Quảng Ninh, Lào Cai, Cao Bằng, khu vực Ba Bể,
khu vực Hà Giang, Bắc Ninh, Tam Đảo, Mộc Châu, Mẫu Sơn, Côn Sơn - Kiếp Bạc và Cát Bà.

Các cơ sở gồm 13 nơi lưu trú, 4 bệnh viện và 1 cảng tàu khách. Danh mục dịch vụ
`VAN_CHUYEN` được bổ sung cho bến/cảng du lịch. Các danh mục mẫu cũ được sửa dấu
tiếng Việt mà không thay đổi ID hoặc liên kết hiện có.

## Nguồn và giới hạn

Tên, loại đối tượng và tọa độ được đối chiếu với OpenStreetMap ngày 11/11/2026.
Mỗi bản ghi lưu URL đối tượng OpenStreetMap trong `nguon_du_lieu` để truy vết.
Dữ liệu OpenStreetMap thuộc bản quyền các cộng tác viên và được cung cấp theo ODbL.

Không tự điền giá vé, giờ mở cửa, số điện thoại hoặc website. Các thông tin này thay đổi
theo thời gian và cần được kiểm tra từ đơn vị vận hành trước khi công bố. Một số địa chỉ
được trình bày theo tên khu vực quen dùng để người dùng dễ nhận biết; tọa độ WGS84 là
thông tin chính dùng trên bản đồ.

## Nhập lại trên CSDL khác

Trong thư mục `backend`:

```powershell
npm.cmd run db:import-northern-tourism
```

Lệnh có thể chạy lại: dữ liệu được nhận diện bằng mã và tên nên không tạo bản ghi trùng.
Trước khi nhập, các bảng liên quan được sao lưu vào `database/backups` và toàn bộ thay đổi
được thực hiện trong một transaction.

## Kiểm tra dữ liệu nguồn

```powershell
node --test tests/northern-tourism-data.test.js
```

Sau khi nhập, các điểm và cơ sở tự xuất hiện trong trang Điểm du lịch, Cơ sở dịch vụ,
WebGIS, thống kê và các chức năng phân tích khoảng cách hiện có.
