# Vercel 部署問題排除指南

## 問題：網站顯示舊版本

### 快速解決方案

#### 方法 1：在 Vercel Dashboard 手動重新部署

1. **前往 Vercel Dashboard**：
   https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro

2. **清除建置快取並重新部署**：
   - 點擊 **Deployments** 標籤
   - 找到最新的部署（commit `7d7676a` 或 `6544dc3`）
   - 點擊部署右側的 **"..."** 選單
   - 選擇 **"Redeploy"**
   - **重要**：勾選 **"Clear build cache and redeploy"**
   - 點擊 **"Redeploy"**

3. **等待部署完成**（約 2-3 分鐘）

4. **驗證部署**：
   - 檢查 Build Logs 中的 Route 列表
   - 應該包含：`/`, `/analyze`, `/report`, `/__version`

#### 方法 2：強制瀏覽器重新整理

如果 Vercel 已部署新版本，但瀏覽器顯示舊內容：

1. **硬性重新整理**：
   - Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **清除瀏覽器快取**：
   - Chrome: 設定 → 隱私權和安全性 → 清除瀏覽資料
   - 選擇「快取的圖片和檔案」
   - 時間範圍選擇「過去 24 小時」

3. **使用無痕模式測試**：
   - 開啟無痕視窗訪問網站
   - 確認是否顯示新版本

#### 方法 3：檢查部署的 Commit

1. **在 Vercel Dashboard**：
   - 前往 **Deployments**
   - 檢查最新部署的 commit SHA
   - 應該顯示 `7d7676a` 或 `6544dc3`

2. **如果顯示舊的 commit**：
   - 點擊 **"Redeploy"**
   - 選擇 **"Use existing Build Cache"** 改為 **"Clear build cache"**
   - 重新部署

## 驗證新版本已部署

### 1. 檢查版本標記

訪問網站後，右下角應該顯示 commit SHA：
- 新版本：`v:7d7676a` 或 `v:6544dc3`
- 舊版本：`v:188c715` 或更早

### 2. 檢查功能

**Analyze 頁面** (`/analyze`) 應該包含：
- ✅ Clinical Summary header
- ✅ 步態指標（speed、cadence、step length）
- ✅ Evidence Base 區塊
- ✅ Methods、Literature、Dataset panels
- ✅ PDF 匯出按鈕

**Report 頁面** (`/report`) 應該包含：
- ✅ 完整的臨床報告
- ✅ Executive Summary
- ✅ Key Findings
- ✅ Clinical Recommendations
- ✅ Evidence Base

### 3. 測試頁面

訪問以下頁面確認：
- `/analyze` - 應該顯示新功能
- `/report` - 應該顯示完整報告
- `/__version` - 應該顯示建置資訊

## 如果還是沒更新

### 檢查清單

1. ✅ **確認 GitHub 有最新 commit**：
   ```bash
   git log --oneline -3
   ```
   應該看到 `7d7676a` 或 `6544dc3`

2. ✅ **確認 Vercel 連接到正確的 repository**：
   - Vercel Dashboard → Settings → Git
   - 確認 Repository 是 `anatomy-quiz-pwa/rungait-pro`
   - 確認 Production Branch 是 `main`

3. ✅ **確認 Vercel 已偵測到新 commit**：
   - Deployments 標籤應該顯示最新的 commit
   - 如果沒有，點擊 "Redeploy"

4. ✅ **清除所有快取**：
   - Vercel: Clear build cache
   - 瀏覽器: Hard refresh
   - CDN: 等待幾分鐘讓 CDN 更新

### 終極解決方案

如果以上方法都不行：

1. **在 Vercel 設定中強制重新部署**：
   - Settings → Git → Disconnect
   - 重新連接 GitHub repository
   - 這會觸發全新的部署

2. **檢查專案設定**：
   - Settings → General
   - 確認 Framework Preset 是 "Next.js"
   - 確認 Root Directory 是空白（或 `./`）

3. **檢查環境變數**：
   - Settings → Environment Variables
   - 確認沒有影響建置的變數

## 當前應該顯示的內容

### Analyze 頁面 (`/analyze`)

當有分析資料時，應該顯示：

1. **Clinical Summary** 區塊：
   - 標題：Clinical Summary
   - 步態指標卡片：速度、步頻、步長
   - PDF 匯出按鈕

2. **影片播放器**

3. **關節角度分析**

4. **AI 分析建議**

5. **Evidence Base** 區塊：
   - Methods（ProvenancePanel）
   - Literature（CitationCard）
   - Dataset

### Report 頁面 (`/report`)

應該顯示完整的臨床報告，包含所有區塊。

## 聯絡支援

如果問題持續存在，請提供：
1. Vercel 建置日誌（完整的 Build Logs）
2. 瀏覽器 Console 的錯誤訊息
3. Network 標籤中的請求狀態

