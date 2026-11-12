# Quản lý tài khoản và phiên đăng nhập

Đăng nhập bằng tài khoản có vai trò `admin`, mở **Tài khoản và phân quyền** trong menu.

- **Thêm tài khoản**: nhập tên đăng nhập, họ tên, mật khẩu từ 8 ký tự, vai trò và trạng thái cho phép đăng nhập.
- **Sửa / cấp quyền**: sửa thông tin, chọn vai trò hoặc bỏ chọn cho phép đăng nhập để khóa tài khoản. Để trống mật khẩu nếu muốn giữ nguyên.
- **Xóa**: xóa tài khoản cùng toàn bộ phiên đăng nhập sau khi xác nhận.
- **Thu hồi**: kết thúc một phiên trong danh sách phiên đang hoạt động. Thu hồi phiên hiện tại sẽ đưa bạn về màn hình đăng nhập.

Mỗi lần lưu sửa tài khoản đều thu hồi toàn bộ phiên của tài khoản đó, bao gồm khi đổi quyền hoặc mật khẩu. Không thể tự xóa, tự khóa hoặc hạ quyền tài khoản quản trị đang sử dụng. API bảo vệ việc giữ lại ít nhất một quản trị viên hoạt động.

## Vai trò

| Vai trò | Quyền |
| --- | --- |
| `admin` | Quản lý tài khoản, cấp quyền, quản lý mọi phiên và toàn bộ dữ liệu nghiệp vụ |
| `editor` | Xem dữ liệu, thêm/sửa điểm du lịch và cơ sở dịch vụ, quản lý phiên của mình |
| `viewer` | Xem và phân tích dữ liệu, quản lý phiên của mình |

Phiên đăng nhập có hiệu lực 8 giờ, dùng cookie HttpOnly; cơ sở dữ liệu chỉ lưu SHA-256 của token. Người dùng thường mở **Phiên đăng nhập** để xem và thu hồi phiên của mình. API kiểm tra vai trò và trạng thái tài khoản trên mỗi yêu cầu.

## API

Tất cả API cần đăng nhập; thao tác thay đổi cần Origin được cấu hình tin cậy.

| Phương thức | Đường dẫn | Quyền |
| --- | --- | --- |
| GET / POST | `/api/accounts` | admin |
| PUT / DELETE | `/api/accounts/:id` | admin |
| GET | `/api/accounts/sessions` | admin xem tất cả, người khác xem phiên của mình |
| DELETE | `/api/accounts/sessions/:id` | admin hoặc chủ phiên |

POST/PUT nhận `{ username, fullName, password, role, active }`. PUT cho phép bỏ qua hoặc để trống password. Không API nào trả về mật khẩu hay hash mật khẩu.

Chức năng sử dụng hai bảng hiện có trong `database/04_authentication.sql`, không cần migration mới. Nếu chưa khởi tạo bảng, chạy `npm.cmd run db:init-auth` trong thư mục backend.

Kiểm thử riêng: `node --test tests/accounts.test.js tests/auth.test.js` tại backend; dựng giao diện: `npm.cmd run build` tại frontend.
