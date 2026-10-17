# An Nhiên Tự — Đi chùa online

Ứng dụng React/Vite tiếng Việt, dùng Firebase Authentication và Cloud Firestore. Dữ liệu tài khoản, hành trình, bảng thiện duyên và lời nguyện đều lấy từ Firebase; không còn tài khoản, thống kê hay nội dung cộng đồng giả lập.

## 1. Tạo Firebase project

1. Mở [Firebase Console](https://console.firebase.google.com/) và chọn **Create a project**.
2. Đặt tên project, chọn bật hoặc tắt Google Analytics tùy nhu cầu rồi hoàn tất wizard.
3. Vào **Project settings** (biểu tượng bánh răng) > **General**.
4. Tại **Your apps**, chọn biểu tượng Web `</>`, đặt nickname và chọn **Register app**.
5. Giữ màn hình chứa object `firebaseConfig`; các giá trị này sẽ được điền ở bước 2.

## 2. Điền biến môi trường Web

File `.env.local` đã được tạo sẵn và bị Git bỏ qua. Điền đúng object Firebase Web app:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Đối chiếu trực tiếp:

| Firebase config | Biến trong project |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Các giá trị Firebase Web config không phải private key; quyền truy cập dữ liệu vẫn do Authentication và Firestore Rules kiểm soát. Tuyệt đối không đặt service-account private key vào biến `VITE_*` vì Vite đưa các biến này vào bundle trình duyệt.

## 3. Bật đăng nhập Google

1. Trong Firebase Console, vào **Build > Authentication** và chọn **Get started**.
2. Mở tab **Sign-in method**.
3. Chọn **Google**, bật **Enable**, chọn email hỗ trợ và **Save**.
4. Mở **Authentication > Settings > Authorized domains**. Thêm domain production của bạn nếu chưa có. `localhost` dùng cho local development thường đã hiện sẵn.

Khách chưa đăng nhập chỉ tham quan và dùng các nghi thức trong phiên hiện tại. Muốn lưu hành trình, reaction, báo cáo, điểm danh hoặc gửi lời nguyện thì phải đăng nhập Google. Project không dùng Anonymous Auth hoặc email/password tự tạo.

## 4. Tạo Cloud Firestore và deploy bảo mật

1. Vào **Build > Firestore Database** > **Create database**.
2. Chọn location gần người dùng, ví dụ một region châu Á. Location không thể đổi dễ dàng về sau.
3. Có thể chọn Production mode; file `firestore.rules` trong repo sẽ thay Rules mặc định.
4. Cài Firebase CLI và đăng nhập:

```bash
npm install -g firebase-tools
firebase login
```

5. Sao chép `.firebaserc.example` thành `.firebaserc`, thay `your-project-id` bằng `VITE_FIREBASE_PROJECT_ID`.
6. Deploy Rules và composite index:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Rules hiện tại bảo đảm:

- Người dùng chỉ đọc/ghi hành trình của chính UID mình; admin có thể phục vụ kiểm duyệt.
- Chỉ tài khoản Google mới được gửi lời nguyện.
- Người thường chỉ đọc sớ đã duyệt; admin đọc được hàng chờ.
- Reaction/báo cáo không thể tự thực hiện cho sớ của mình và mỗi UID chỉ thêm một lần.
- Quyền admin lấy từ token đã ký của Firebase, không lấy từ email hay state phía trình duyệt.

## 5. Tạo đúng một tài khoản admin

Admin cũng là tài khoản Google, nhưng được thêm custom claim `admin: true` bằng Firebase Admin SDK.

1. Chạy app và đăng nhập Google **ít nhất một lần** bằng email sẽ làm admin. Bước này tạo Firebase Auth user.
2. Trong Firebase Console, vào **Project settings > Service accounts**.
3. Chọn **Generate new private key**, xác nhận và tải JSON về. Không chép file JSON đó vào repo.
4. Mở `.env.admin.local` và điền từ JSON cùng email admin:

```dotenv
FIREBASE_ADMIN_PROJECT_ID=giá_trị_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=giá_trị_client_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_EMAIL=admin-cua-ban@gmail.com
```

5. Chạy:

```bash
npm run firebase:set-admin
```

Script tìm user theo email, xác nhận user có Google provider, cấp `admin: true` và gỡ claim admin khỏi mọi tài khoản khác. Vì vậy hệ thống chỉ có một admin. Sau khi chạy, đăng xuất rồi đăng nhập lại để nhận ID token mới.

Hai file `.env.local` và `.env.admin.local`, `.firebaserc`, service-account JSON, log emulator và ảnh QA đều đã được `.gitignore` bảo vệ.

## 6. Chạy local và kiểm tra

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Các lệnh kiểm tra:

```bash
npm run build        # TypeScript + production build
npm run lint         # ESLint
npm test             # unit test nghiệp vụ
npm run test:rules   # Firestore Emulator + security tests
npm run test:mobile  # cần dev server ở http://127.0.0.1:4175
npm run test:firebase-auth # cần dev server ở http://localhost:4175
npm audit --omit=dev
```

`test:mobile` kiểm tra 10 route ở 360×800, 390×844 và 430×932, gồm tràn ngang, console/resource error và menu cảm ứng. Có thể đổi URL bằng `MOBILE_TEST_URL`.

## 7. Deploy Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` đã cấu hình thư mục `dist` và SPA rewrite về `index.html`. Sau deploy, nhớ thêm domain Hosting vào **Authentication > Settings > Authorized domains** nếu Firebase chưa tự thêm.

## Cấu trúc dữ liệu Firestore

- `user_states/{uid}`: công đức, nhật ký, hương, quẻ, điểm danh, lễ vật và tùy chọn.
- `users/{uid}`: hồ sơ Google riêng; chủ tài khoản và admin đọc được.
- `leaderboard/{uid}`: tên hiển thị và tổng công đức.
- `wishes/{id}`: lời nguyện, trạng thái duyệt, reaction và báo cáo.

Âm lịch được tính từ ngày dương bằng `lunar-typescript`, không dùng ngày mẫu. Âm thanh mõ dùng bản thu “Mokugyo.wav” của jonopodmore theo giấy phép CC0; nguồn tại `public/audio/LICENSE.txt`.
