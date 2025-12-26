# 更新日誌

## [未發布] - 2025-01-XX

### 新增功能

- ✨ 整合影片分析功能
  - 新增影片上傳 API (`/api/analyze`)
  - 支援實際影片分析（連接 Python 服務）
  - 自動回退到 mock 資料（當分析服務不可用時）

- ✨ 完整的臨床報告功能
  - Clinical Summary header
  - 顯示步態指標（speed、cadence、step length）
  - Evidence Panels（Literature、Dataset、Methods）
  - PDF 匯出按鈕（預留功能）

- ✨ 新增組件
  - `ProvenancePanel` - 顯示資料來源與處理流程
  - `CitationCard` - 顯示文獻引用

- ✨ Mock 資料系統
  - 建立 `src/lib/mock.ts` 提供完整的 mock 資料
  - 更新 `AnalysisPacket` 型別，加入步態指標欄位

### 改進

- 🔄 更新 `analyze/page.tsx`
  - 從 mock 資料讀取（而非 API）
  - 支援實際上傳與分析影片
  - 改進錯誤處理與回退機制

- 🔄 更新型別定義
  - `AnalysisPacket` 新增 `speed`、`cadence`、`stepLength` 欄位

### 文件

- 📝 新增 `INTEGRATION_GUIDE.md` - Python 服務整合指南
- 📝 更新 `.gitignore` - 排除 Python 服務與分析結果檔案

### 技術細節

- Python 服務獨立於主專案（`python-service/` 目錄，不提交到 Git）
- 保持介面進度與分析程式分離

