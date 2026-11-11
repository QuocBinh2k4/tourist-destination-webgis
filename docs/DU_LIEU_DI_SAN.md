# Dữ liệu di sản văn hóa Việt Nam

Đã bổ sung 30 hồ sơ chọn lọc: 6 di tích/di sản thế giới, 15 di sản phi vật thể,
3 bảo vật, 3 bảo tàng và 3 di sản tư liệu. Đây không phải toàn bộ danh mục Việt Nam.

## Khởi tạo trên CSDL khác

Sau khi tạo các bảng nghiệp vụ bằng `database/01_khoi_tao_csdl_tourismgis.sql`,
cấu hình `backend/.env`, chạy trong thư mục `backend`:

```powershell
npm.cmd run db:import-heritage
```

Lệnh tạo bảng `tourism.di_san_van_hoa`, thêm 5 loại hình và nhập hồ sơ.
Chạy lại không thêm trùng mã và không ghi đè nội dung đã sửa.
Các tên loại hình mẫu `Van hoa`, `Lich su`, `Sinh thai` được bổ sung dấu tiếng Việt;
giữ nguyên ID, dữ liệu và liên kết hiện có.
Trước khi ghi, script lưu các bảng điểm/loại hình/liên kết vào `database/backups`.
Các thay đổi CSDL chạy trong một transaction và rollback nếu gặp lỗi.
Khởi động lại backend sau khi cập nhật mã để có API `GET /api/di-san`.

## Phạm vi và nguồn

- Cấu trúc nhóm: https://dsvh.gov.vn/thong-tin-di-san-van-hoa-121
- Di tích: https://dsvh.gov.vn/di-san-van-hoa-va-thien-nhien-the-gioi-1754
- Phi vật thể: https://dsvh.gov.vn/di-san-van-hoa-phi-vat-the-dai-dien-cua-nhan-loai-1755
- Bảo vệ khẩn cấp: https://dsvh.gov.vn/di-san-van-hoa-phi-vat-the-can-bao-ve-khan-cap-1756
- Bảo vật: https://dsvh.gov.vn/bao-vat-quoc-gia-1758
- Bảo tàng: https://baotang.dsvh.gov.vn/
- Tư liệu: https://dsvh.gov.vn/di-san-tu-lieu-1761

Đối chiếu ngày 11/11/2026. Năm và địa bàn giữ theo danh mục nguồn, có thể chưa phản ánh
địa giới hoặc các lần ghi danh mới hơn. Không dùng bộ dữ liệu này để tuyên bố số lượng
di sản quốc gia hiện tại. Không nhập các mục danh sách nghệ nhân thành điểm du lịch.
Không nhập giá vé, giờ mở cửa, số điện thoại hoặc ảnh chưa kiểm chứng.

Tọa độ của 6 địa điểm lấy từ UNESCO World Heritage Centre, có URL riêng trong
`database/data/diSanVietNam.js` và `ghi_chu_toa_do` của hồ sơ. Tọa độ đại diện cho
điểm tham chiếu của di sản hoặc một hợp phần; không phải cổng vào, ranh giới hay
vị trí khảo sát dịch vụ. Huế dùng hợp phần Kinh thành; Thành nhà Hồ dùng Thành nội.
Không gán tọa độ tùy ý cho phi vật thể, hiện vật, tư liệu hay bảo tàng chưa có nguồn tọa độ.

## Kiểm tra

```powershell
node --test tests/heritage-data.test.js tests/auth.test.js
```

Trong ứng dụng, vào **Di sản văn hóa** để lọc nhóm/phân loại, tìm tên có dấu hoặc không dấu,
và xem nguồn. Vào **Loại hình du lịch** để quản lý danh mục, xem số điểm và số hồ sơ riêng.
Sáu điểm tham chiếu cũng xuất hiện trong Điểm du lịch, WebGIS và các API nghiệp vụ hiện có.
