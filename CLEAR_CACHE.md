# 清除 Vercel 快取步驟

## 方法 1：使用 Vercel Dashboard（推薦）

### 步驟：

1. **前往 Vercel Dashboard**：
   https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro/deployments

2. **找到最新的部署**（應該顯示 commit `70b1230`）

3. **清除快取並重新部署**：
   - 點擊部署右側的 **"..."** 選單
   - 選擇 **"Redeploy"**
   - **重要**：勾選 **"Clear build cache and redeploy"**
   - 點擊 **"Redeploy"** 按鈕

4. **等待部署完成**（約 2-3 分鐘）

5. **驗證**：
   - 檢查 Build Logs 中的 Route 列表
   - 應該包含 `/report` 路由
   - 訪問網站確認版本標記更新

## 方法 2：使用 Vercel CLI

如果已安裝 Vercel CLI：

```bash
cd rungait-pro
vercel --prod --force
```

## 方法 3：清除所有快取（終極方案）

如果以上方法都不行：

1. **在 Vercel Dashboard**：
   - Settings → General
   - 找到 "Clear Build Cache" 選項
   - 點擊清除

2. **重新連接 Git**：
   - Settings → Git
   - Disconnect repository
   - 重新連接 `anatomy-quiz-pwa/rungait-pro`
   - 這會觸發全新的部署

## 驗證快取已清除

部署完成後，檢查：

1. **版本標記**：網站右下角應顯示 `v:70b1230` 或更新
2. **Route 列表**：Build Logs 應包含 `/report`
3. **功能測試**：
   - `/analyze` 應顯示 Clinical Summary 和 Evidence Base
   - `/report` 應顯示完整報告

