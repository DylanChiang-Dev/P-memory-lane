# Memory Lane 記憶巷弄

個人生活追蹤與媒體庫管理系統。

## 功能特色

- 🎬 **媒體庫** - 追蹤電影、劇集、書籍、遊戲、播客、動畫
- 📊 **習慣追蹤** - 運動、閱讀、語言學習熱力圖
- 🌓 **深色/淺色模式** - 自適應主題
- 🔐 **JWT 認證** - 安全的用戶登錄

## 技術棧

- **前端**: Astro + React + Tailwind CSS
- **外部 API**: TMDB, IGDB, iTunes, AniList, Google Books

---

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

訪問 http://localhost:4321

---

## CF Pages 部署

### 1. 連接 GitHub 倉庫

1. 登錄 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 進入 **Pages** → **Create a project** → **Connect to Git**
3. 選擇 `P-memory-lane` 倉庫

### 2. 構建設置

| 設置項 | 值 |
|--------|-----|
| Framework preset | `Astro` |
| Build command | `npm run build` |
| Build output directory | `dist` |

### 3. 環境變量（可選）

本項目外部 API 密鑰由後端保存（與帳號綁定），前端不再存放第三方密鑰。

### 4. 後端 CORS 配置

確保後端 `https://pyqapi.3331322.xyz` 允許 CF Pages 域名：

```
Access-Control-Allow-Origin: https://your-project.pages.dev
```

### 5. 部署完成

推送到 `main` 分支會自動觸發部署。

---

## 目錄結構

```
src/
├── components/     # React 組件
├── layouts/        # 頁面布局
├── lib/            # API 和工具函數
├── pages/          # Astro 頁面
└── styles/         # 全局樣式
```

---

## License

MIT
