# 夥伴 Sun Analysis 功能對齊診斷

## 問題現象
部署成功後，夥伴 Sun 寫好的 analysis 功能在新網站上看不到。

## 根本原因

**Next.js 路由優先順序**：當 `app/` 與 `src/app/` 同時存在時，**根目錄的 `app/` 會優先**，`src/app/` 會被忽略。

| 目錄 | 狀態 | 說明 |
|------|------|------|
| `app/` | ✅ 使用中 | 我們的 rungait 版本（/analyze, /compare, /lab, /report...） |
| `src/app/` | ❌ 被忽略 | 夥伴 Sun 的版本（/upload, /single, /job, /result） |

因此夥伴的以下路由**不會被建置**：
- `/upload` - 上傳影片
- `/single` - Single Analysis 清單
- `/job/[id]` - 分析任務結果
- `/result` - 結果頁

## 夥伴 Sun 的 Analysis 流程
1. 首頁 → 「Log in and upload your running video」→ `/upload`
2. 或「Single Analysis」→ `/single`（列出 jobs，點擊 → `/job/[id]`）
3. 上傳後 → `/result?jobId=xxx`

## 我們的 app/page.tsx 目前連結
- Single Analysis → `/analyze`（我們的 on-device MediaPipe 流程，非夥伴的）
- Before/After → `/compare`
- 沒有 `/upload`、`/single` 入口

## 修復方案（已執行）
將夥伴的關鍵頁面複製到 `app/`，使其被建置並可存取。

### 新增檔案
- `app/upload/page.tsx` - 上傳影片（R2 + jobs）
- `app/single/page.tsx` - Single Analysis 清單
- `app/job/[id]/page.tsx` - 分析任務結果
- `app/result/page.tsx` - 結果頁（?jobId=）
- `app/api/r2-presign/route.ts` - R2 預簽 API
- `lib/supabaseClient.ts` - 夥伴相容（supabase 單例）
- `components/JobResultView.tsx` - re-export 自 src/components

### 導航更新
- 首頁：新增「Upload（夥伴 Sun）」卡片
- Header：新增 Upload、Single 連結
