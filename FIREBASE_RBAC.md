# Phân quyền người dùng Firebase

Ứng dụng ưu tiên đọc vai trò theo email từ tab `Danh Mục Tài Khoản` trong Google Sheets. Firebase Authentication custom claim `role` là lớp dự phòng khi tab chưa có tài khoản hợp lệ.

| Vai trò | Quyền |
| --- | --- |
| `admin` | Quản lý danh mục, nhập/xuất, đọc và ghi Google Sheets |
| `operator` | Nhập/xuất, đọc và ghi Google Sheets; không sửa danh mục |
| `viewer` | Chỉ xem và tải dữ liệu từ Google Sheets |

Tài khoản đã đăng nhập nhưng chưa có claim được giữ ở vai trò `operator` để không làm gián đoạn quy trình nhập liệu hiện tại. Khi không đọc được claim, App hạ quyền về `viewer`.

## Quản lý trong Google Sheets

Tab `Danh Mục Tài Khoản` gồm các cột:

- `Email`: email Google dùng để đăng nhập App.
- `Tên Hiển Thị`: tên nhân viên.
- `Vai Trò`: chọn `admin`, `operator` hoặc `viewer`.
- `Trạng Thái`: `Hoạt động` hoặc `Ngừng hoạt động`.
- `Ghi Chú`: thông tin nội bộ tùy chọn.

Khi tab đã có ít nhất một email hợp lệ, tài khoản không nằm trong danh sách hoặc đã ngừng hoạt động sẽ chỉ có quyền `viewer`. Sau khi sửa danh mục, bấm `Sheet → App` hoặc đăng nhập lại để áp dụng quyền mới.

## Gán vai trò

Custom claims phải được gán trong môi trường máy chủ tin cậy bằng Firebase Admin SDK; không gán ở mã trình duyệt. Ví dụ Node.js chạy bằng service account của dự án:

```js
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: cert(serviceAccount) });

const user = await getAuth().getUserByEmail('user@company.com');
await getAuth().setCustomUserClaims(user.uid, { role: 'admin' });
```

Sau khi đổi vai trò, người dùng đăng xuất rồi đăng nhập lại để nhận ID token mới.

## Lưu ý bảo mật

Phân quyền giao diện không thay thế quyền chia sẻ của Google Sheets. Chỉ cấp quyền Editor trên file Google Sheets cho người thực sự được phép ghi; tài khoản `viewer` nên có quyền Viewer trên file.
