# Dynamic English Player — Anh Ngữ Sinh Động

Ứng dụng web học tiếng Anh cá nhân, gọn nhẹ và hiện đại dành cho khóa học kinh điển **Anh Ngữ Sinh Động / New Dynamic English** (toàn bộ 340 bài học).

Ứng dụng được thiết kế tối giản, tập trung vào trải nghiệm học tập:
> **Bài học (Lesson) → Nghe âm thanh (Audio) → Ghi chú học tập (Study Notes) → Bản ghi lời thoại (Transcript)**

---

## 🌟 Tính năng nổi bật (Features)

1. **Trình phát âm thanh đầy đủ tính năng (Full-Featured Audio Player)**
   - Phát âm thanh trực tiếp (stream) từ nguồn chính thống LopNgoaiNgu.com mà không cần tải hay lưu trữ audio về máy.
   - Hỗ trợ Play, Pause, Seek thanh trượt thời gian, tua trước/sau.
   - Tùy chỉnh tốc độ phát lại đa dạng: `0.75×`, `1×`, `1.25×`, `1.5×`, `2×`.
   - Điều chỉnh âm lượng và tự động chuyển bài tiếp theo khi kết thúc (Auto-advance).
   - Thanh điều khiển nổi cố định dưới đáy màn hình (Dock Player) tiện lợi khi cuộn trang hoặc dùng trên điện thoại di động.

2. **Ghi chú học tập thông minh có cơ sở (AI-Grounded Study Notes)**
   - Toàn bộ **340 bài học** đều đã được tích hợp đầy đủ ghi chú:
     - **Summary**: Bản tóm tắt cô đọng, dễ hiểu về nội dung và tình huống trong bài.
     - **Key sentence patterns**: Các mẫu câu giao tiếp trọng tâm kèm bản dịch nghĩa tiếng Việt.
     - **Vocabulary**: Danh sách từ vựng then chốt kèm định nghĩa sát với ngữ cảnh bài học.
   - Nội dung được tạo bởi mô hình AI (Google Gemini) với quy chuẩn đối soát nguồn nghiêm ngặt, đảm bảo 100% bám sát nội dung gốc, tuyệt đối không bịa đặt từ vựng hay quy tắc ngữ pháp.

3. **Xem Transcript ngay trong ứng dụng (Embedded Transcript on-demand)**
   - Đọc bản ghi lời thoại trực tiếp mà không cần rời trang hoặc mở tab ngoài.
   - Tải theo nhu cầu (chỉ tải khi người dùng bấm *"Show transcript"* để tiết kiệm băng thông và tăng tốc tải trang).
   - Được làm sạch, loại bỏ các thành phần thừa từ trang nguồn.
   - Xử lý thông qua Vercel Serverless Function an toàn (`/api/transcript?id=N`), phòng chống tấn công SSRF.

4. **Theo dõi tiến độ học tập tự động (Progress Tracking)**
   - Lưu trữ cục bộ qua trình duyệt (`localStorage`), không cần đăng nhập tài khoản:
     - Ghi nhớ bài học đang nghe dở dang.
     - Lưu mốc thời gian (timestamp) đã nghe của từng bài để tiếp tục nghe lại.
     - Đánh dấu bài học đã hoàn thành (*Mark as completed*).
     - Ghi nhớ tốc độ phát yêu thích.
   - Tự động khôi phục an toàn, không làm ứng dụng bị lỗi nếu dữ liệu lưu trữ bị trống hoặc sai lệch.

5. **Tìm kiếm & Phân loại bài học thông minh**
   - Danh sách 340 bài học được chia theo 4 phần rõ ràng:
     - **Part 1:** Bài 1 – 100
     - **Part 2:** Bài 101 – 200
     - **Part 3:** Bài 201 – 300
     - **Part 4:** Bài 301 – 340
   - Tìm kiếm tức thì theo số bài học (vd: `56`, `Lesson 12`) hoặc tên bài học.

6. **Giao diện hiện đại & Tương thích mọi thiết bị (Responsive Design)**
   - Thiết kế chuẩn "Study-first": trang nhã, tập trung, dễ nhìn, font chữ rõ ràng.
   - Tối ưu hoàn hảo cho màn hình máy tính (Desktop), máy tính bảng (Tablet) và điện thoại di động (Mobile).

---

## 📁 Cấu trúc thư mục dự án (Project Directory Structure)

```text
Dynamic_English/
├── api/                           # Vercel Serverless Functions
│   └── transcript.js              # Endpoint xử lý lấy và làm sạch transcript an toàn
├── data/                          # Kho dữ liệu khóa học
│   ├── lessons.json               # Manifest chuẩn 340 bài học (đầy đủ metadata & AI notes)
│   ├── source-lessons/            # Bản trích xuất nội dung gốc bài học dạng JSON (1-340)
│   └── ai-enrichment/             # Dữ liệu đối soát AI enrichment của từng bài
├── lib/                           # Các thư viện logic xử lý backend và pipeline
│   ├── ai-enrichment.mjs          # Giao tiếp với Gemini API để sinh study notes
│   ├── lesson-enrichment-merge.mjs# Kiểm tra bằng chứng và gộp dữ liệu vào manifest
│   ├── source-content.mjs         # Trích xuất và bóc tách nội dung HTML gốc
│   ├── transcript-api.mjs         # Logic xử lý nghiệp vụ cho Transcript API
│   └── vercel-build.mjs           # Script chuẩn bị tài nguyên tĩnh trước khi deploy Vercel
├── public/                        # Mã nguồn giao diện người dùng (Frontend)
│   ├── app.js                     # File điều khiển chính của giao diện web
│   ├── index.html                 # Giao diện HTML của ứng dụng
│   ├── styles.css                 # Toàn bộ định dạng giao diện (Vanilla CSS)
│   └── src/                       # Các module JS phía client
│       ├── lessons.js             # Logic tải danh sách, lọc và tìm kiếm bài học
│       ├── player.js              # Logic điều khiển trình phát âm thanh và audio events
│       └── progress-store.js      # Logic lưu/đọc tiến độ người dùng từ localStorage
├── scripts/                       # Các công cụ dòng lệnh (Automation & Dev)
│   ├── dev-server.mjs             # Web server phát triển cục bộ (kèm API transcript)
│   ├── validate-data.mjs          # Script kiểm tra tính toàn vẹn của dữ liệu 340 bài
│   ├── extract-source-lessons.mjs # Script trích xuất nội dung từ trang web nguồn
│   ├── enrich-lessons.mjs         # Script gửi yêu cầu tới Gemini để tạo study notes
│   ├── apply-enrichment.mjs       # Script kiểm duyệt và cập nhật study notes vào lessons.json
│   └── build-vercel.mjs           # Script build cho môi trường Vercel
├── test/                          # Bộ kiểm thử tự động (Unit test)
├── AGENTS.md                      # Đặc tả kỹ thuật và kiến trúc chuẩn của dự án
└── package.json                   # Cấu hình dự án và danh sách câu lệnh npm
```

---

## 🔄 Quy trình hoạt động (Workflow)

### 1. Luồng vận hành ứng dụng (Runtime Workflow)
```text
Người dùng mở ứng dụng (http://127.0.0.1:4173)
       ↓
Browser tải public/index.html & đọc public/data/lessons.json
       ↓
Hiển thị danh sách 340 bài học + Khôi phục bài gần nhất từ localStorage
       ↓
Bấm Play ───► Trình duyệt stream trực tiếp audio từ LopNgoaiNgu.com
       ↓
Xem Study Notes (Tóm tắt, mẫu câu, từ vựng) đã có sẵn trong metadata
       ↓
Bấm "Show transcript" ───► Gọi API GET /api/transcript?id=N (chỉ tải khi mở)
       ↓
Tiến độ, vị trí audio, trạng thái hoàn thành tự động lưu vào localStorage
```

### 2. Luồng xây dựng & làm giàu dữ liệu (Data Pipeline Workflow)
```text
Trang web nguồn (LopNgoaiNgu.com)
       ↓ (npm run extract)
data/source-lessons/{id}.json (Nội dung gốc được bóc tách)
       ↓ (npm run enrich)
data/ai-enrichment/{id}.json (AI tạo summary, key patterns, vocabulary)
       ↓ (npm run apply-enrichment)
Kiểm tra cấu trúc & bằng chứng (Evidence Validation)
       ↓
data/lessons.json (Cập nhật vào manifest chính thức)
       ↓ (npm run validate)
Xác nhận tính hợp lệ của toàn bộ 340 bài học
```

---

## 🚀 Hướng dẫn cho người mới bắt đầu (Getting Started)

### Yêu cầu cài đặt trước (Prerequisites)
- Đã cài đặt **Node.js** phiên bản `18.17.0` trở lên trên máy tính ([Tải tại nodejs.org](https://nodejs.org/)).
- Đã cài đặt **Git**.

---

### Bước 1: Sao chép dự án về máy (Clone Repository)
Mở cửa sổ dòng lệnh (Terminal trên macOS/Linux hoặc PowerShell trên Windows) và chạy:

```bash
git clone https://github.com/hoang-ama/new-dynamic-english-player.git
cd new-dynamic-english-player
```

---

### Bước 2: Cài đặt các gói phụ thuộc (Install Dependencies)
Cài đặt các thư viện cần thiết bằng lệnh:

```bash
npm install
```

---

### Bước 3: Chạy ứng dụng trên môi trường cục bộ (Run Locally)
Khởi động máy chủ phát triển (Dev server) tích hợp sẵn:

```bash
npm run dev
```

Sau khi chạy lệnh, màn hình terminal sẽ hiển thị:
```text
Dynamic English Player running at http://127.0.0.1:4173
```

👉 **Mở trình duyệt web của bạn và truy cập:** `http://127.0.0.1:4173` để bắt đầu học!

---

## 🛠️ Các lệnh npm hữu ích (Useful npm Commands)

| Lệnh | Ý nghĩa |
|---|---|
| `npm run dev` | Khởi chạy máy chủ cục bộ hỗ trợ đầy đủ web player và API transcript tại port `4173`. |
| `npm run validate` | Kiểm tra tính toàn vẹn của dữ liệu: đảm bảo đủ 340 bài, định dạng URL âm thanh, cấu trúc trường. |
| `npm test` | Chạy bộ kiểm thử đơn vị (Unit tests) cho các chức năng backend và logic dữ liệu. |
| `npm run test:e2e` | Chạy kiểm thử tự động toàn diện từ đầu đến cuối trên trình duyệt bằng Playwright. |
| `npm run build:vercel` | Kiểm tra dữ liệu và sao chép manifest bài học vào thư mục `public/` để sẵn sàng triển khai tĩnh trên Vercel. |

---

## 🌐 Hướng dẫn Triển khai lên Vercel (Deployment)

Dự án tương thích hoàn hảo với nền tảng lưu trữ [Vercel](https://vercel.com):

1. **Deploy tự động qua GitHub:**
   - Đưa dự án lên GitHub.
   - Đăng nhập vào [Vercel](https://vercel.com) và chọn **Add New Project** → Chọn repository này.
   - Vercel sẽ tự động phát hiện cấu hình và chạy `npm run build:vercel`.
   - File cấu hình `vercel.json` và `api/transcript.js` đã được thiết lập sẵn sàng để hoạt động ngay mà không cần cấu hình thêm.

2. **Deploy qua Vercel CLI:**
   ```bash
   npx vercel
   ```

---

## ⚖️ Bản quyền & Nguồn trích dẫn (Attribution & Disclaimer)

- **Nguồn khóa học:** *LopNgoaiNgu.com — New Dynamic English (Anh Ngữ Sinh Động)*.
- Ứng dụng phát trực tiếp âm thanh từ nguồn LopNgoaiNgu.com, không sở hữu bản quyền hay lưu trữ trái phép các tệp âm thanh gốc.
- Dự án này phục vụ mục đích học tập cá nhân phi thương mại.