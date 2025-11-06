# 影片分析功能整合指南

本指南說明如何將 Sun repository 的影片分析功能整合到 RunGait Pro 專案中。

## 架構概述

整合方案包含三個主要部分：

1. **Next.js API Route** (`/api/analyze`) - 接收影片上傳並調用 Python 服務
2. **Python Flask 服務** (`python_service.py`) - 包裝 Sun repository 的分析功能
3. **前端頁面** (`/analyze`) - 上傳影片並顯示分析結果

## 設定步驟

### 1. 設定 Python 環境

```bash
# 安裝 Python 依賴
pip install flask flask-cors ultralytics opencv-python numpy scipy openpyxl pillow
```

### 2. 設定 Sun Repository

```bash
# Clone Sun repository（如果還沒有的話）
git clone https://github.com/Archiken/Sun.git /path/to/Sun

# 下載模型權重
# 從 https://github.com/Archiken/Sun/releases 下載 best.pt
# 放置到：/path/to/Sun/runs/pose/rp11-2/weights/best.pt
```

### 3. 設定環境變數

在專案根目錄建立 `.env.local`：

```bash
# Python API 服務 URL
PYTHON_API_URL=http://localhost:8000

# Sun repository 路徑（用於 Python 服務）
SUN_REPO_PATH=/path/to/Sun

# 模型路徑（用於 Python 服務）
MODEL_PATH=/path/to/Sun/runs/pose/rp11-2/weights/best.pt

# 輸出目錄
OUTPUT_DIR=./results

# 影片幀率
REAL_FPS=240
```

### 4. 啟動 Python 服務

```bash
# 在 rungait-pro 目錄下
cd rungait-pro/src/app/api/analyze
python python_service.py
```

服務將在 `http://localhost:8000` 啟動。

### 5. 啟動 Next.js 開發伺服器

```bash
# 在 rungait-pro 目錄下
pnpm dev
```

## 使用方式

1. 開啟 `http://localhost:3000/analyze`
2. 點擊「上傳影片」選擇影片檔案
3. 點擊「開始分析」按鈕
4. 等待分析完成（可能需要幾分鐘）
5. 查看分析結果

## 整合 Sun Repository 的實際功能

目前 `python_service.py` 只是一個範例實作。要整合實際的 Sun repository 功能，需要：

### 選項 A：直接調用 phase_detection.py

修改 `python_service.py` 的 `analyze` 函數：

```python
from phase_detection import main, collect_angles_footY_and_anklehip
from yolo_pose_analysis import clean_and_smooth_series
from foot_ICTO import smooth_and_derivatives, find_local_mins_below_mean

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    video_path = data.get('video_path')
    
    # 載入模型
    model = YOLO(MODEL_PATH)
    
    # 調用 phase_detection 的函數
    fps, (W, H), frame_ids, hip_raw, knee_raw, foot_y_up, ...
        = collect_angles_footY_and_anklehip(model, video_path, ...)
    
    # 處理資料並返回結果
    # ...
```

### 選項 B：將 phase_detection.py 改寫為可匯入的模組

1. 將 `phase_detection.py` 中的 `main()` 函數改寫為可接受參數的函數
2. 將分析邏輯提取為獨立函數
3. 在 `python_service.py` 中匯入並調用

## 資料格式轉換

Python 服務需要返回以下格式的 JSON：

```json
{
  "fps": 240,
  "duration": 3.2,
  "frame_ids": [0, 1, 2, ...],
  "hip_angles": [...],
  "knee_angles": [...],
  "ankle_angles": [...],
  "ic_frames": [...],
  "to_frames": [...],
  "speed": 3.5,
  "cadence": 175,
  "step_length": 1.2,
  "subject_id": "unknown",
  "notes": "",
  "ai_insights": []
}
```

Next.js API route 會將這個格式轉換為 `AnalysisPacket` 格式。

## 故障排除

### Python 服務無法啟動

- 檢查 Python 版本（建議 3.8+）
- 確認所有依賴都已安裝
- 檢查模型權重檔案是否存在

### 分析失敗

- 檢查影片格式是否支援
- 確認影片路徑正確
- 查看 Python 服務的日誌輸出

### 前端無法連接 Python 服務

- 確認 Python 服務正在運行
- 檢查 `PYTHON_API_URL` 環境變數設定
- 確認 CORS 設定正確

## 下一步

1. 完善 `python_service.py` 以實際調用 Sun repository 的功能
2. 實作結果快取機制（避免重複分析）
3. 添加分析進度追蹤（WebSocket 或輪詢）
4. 優化大型影片的處理效能

