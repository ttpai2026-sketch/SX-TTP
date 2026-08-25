# Phân quyền người dùng Firebase

Ứng dụng đọc vai trò từ Firebase Authentication custom claim `role`.

| Vai trò | Quyền |
| --- | --- |
| `admin` | Quản lý danh mục, nhập/xuất, đọc và ghi Google Sheets |
| `operator` | Nhập/xuất, đọc và ghi Google Sheets; không sửa danh mục |
| `viewer` | Chỉ xem và tải dữ liệu từ Google Sheets |

Tài khoản đã đăng nhập nhưng chưa có claim được giữ ở vai trò `operator` để không làm gián đoạn quy trình nhập liệu hiện tại. Khi không đọc được claim, App hạ quyền về `viewer`.

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
