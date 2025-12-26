# 按鈕調試指南

## 問題診斷

如果按鈕無法點擊，請按照以下步驟檢查：

### 1. 檢查瀏覽器控制台

打開瀏覽器開發者工具（F12），查看 Console 標籤：

- 點擊 "Upload Video" 按鈕時，應該看到：
  ```
  Upload button clicked
  Input element: <input id="video-upload" ...>
  Input click triggered
  ```

- 點擊 "Export Report" 按鈕時，應該看到：
  ```
  Export Report button clicked
  ```

### 2. 檢查按鈕狀態

- **Upload Video 按鈕**：
  - 如果 `isLoading` 為 `true`，按鈕會被禁用
  - 檢查按鈕是否有 `disabled` 屬性

- **Export Report 按鈕**：
  - 如果 `analysisData` 為 `null`，按鈕會被禁用
  - 需要先載入分析資料才能使用

### 3. 檢查 CSS 問題

- 檢查是否有其他元素遮擋按鈕（z-index 問題）
- 檢查是否有 `pointer-events: none` 樣式
- 檢查按鈕是否有正確的 `cursor: pointer` 樣式

### 4. 檢查事件處理器

- 確認 `onClick` 事件處理器已正確綁定
- 確認沒有其他事件處理器阻止事件傳播

### 5. 測試步驟

1. **測試 Upload Video 按鈕**：
   - 打開瀏覽器控制台
   - 點擊 "Upload Video" 按鈕
   - 應該看到調試日誌
   - 應該開啟文件選擇對話框

2. **測試 Export Report 按鈕**：
   - 確保已經載入分析資料（頁面應該顯示影片和分析結果）
   - 點擊 "Export Report" 按鈕
   - 應該看到調試日誌
   - 應該開啟報告頁面

### 6. 常見問題

#### 問題：按鈕完全無法點擊
- **可能原因**：有其他元素遮擋
- **解決方案**：檢查 z-index，確保按鈕在最上層

#### 問題：點擊後沒有任何反應
- **可能原因**：事件處理器未正確綁定
- **解決方案**：檢查控制台是否有錯誤訊息

#### 問題：文件選擇對話框未開啟
- **可能原因**：input 元素未找到或無法點擊
- **解決方案**：檢查 input 元素的 id 是否正確

### 7. 強制重新整理

如果問題仍然存在，請：
1. 強制重新整理瀏覽器（Cmd+Shift+R 或 Ctrl+Shift+R）
2. 清除瀏覽器快取
3. 檢查 Vercel 部署是否是最新版本

