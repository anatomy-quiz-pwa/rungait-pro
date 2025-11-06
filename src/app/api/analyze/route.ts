import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { AnalysisPacket } from '@/src/types/gait';

// Python 分析服務的 URL（可以透過環境變數設定）
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未提供影片檔案' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: '檔案必須是影片格式' },
        { status: 400 }
      );
    }

    // 儲存上傳的影片到臨時目錄
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    // 選項 1: 直接調用 Python 腳本（如果 Python 在系統路徑中）
    // 選項 2: 調用 Python API 服務（推薦）
    
    // 這裡我們先實作選項 2：調用 Python API 服務
    const pythonResponse = await fetch(`${PYTHON_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_path: filepath,
        filename: filename,
      }),
    });

    if (!pythonResponse.ok) {
      // 如果 Python API 不可用，回退到 mock 資料
      console.warn('Python API 不可用，使用 mock 資料');
      return NextResponse.json({
        message: '分析服務暫時不可用，返回示範資料',
        useMock: true,
      });
    }

    const pythonResult = await pythonResponse.json();

    // 將 Python 分析結果轉換為 AnalysisPacket 格式
    const analysisPacket = convertPythonResultToAnalysisPacket(
      pythonResult,
      `/uploads/${filename}`
    );

    return NextResponse.json(analysisPacket);
  } catch (error) {
    console.error('分析錯誤:', error);
    return NextResponse.json(
      { error: '分析過程中發生錯誤', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 將 Python 分析結果轉換為 AnalysisPacket 格式
function convertPythonResultToAnalysisPacket(
  pythonResult: any,
  videoUrl: string
): AnalysisPacket {
  // 這裡需要根據實際的 Python 輸出格式來轉換
  // 假設 Python 返回的格式包含：
  // - frame_ids: 幀數陣列
  // - hip_angles: 髖關節角度陣列
  // - knee_angles: 膝關節角度陣列
  // - ankle_angles: 踝關節角度陣列
  // - ic_frames: 初始接觸幀數陣列
  // - to_frames: 離地幀數陣列
  // - fps: 影片幀率
  // - speed, cadence, step_length: 步態指標

  const fps = pythonResult.fps || 30;
  const duration = pythonResult.duration || 3.2;

  // 轉換角度資料
  const frameIds = pythonResult.frame_ids || [];
  const hipAngles = pythonResult.hip_angles || [];
  const kneeAngles = pythonResult.knee_angles || [];
  const ankleAngles = pythonResult.ankle_angles || [];

  // 建立角度樣本
  const hipSamples = frameIds.map((frameId: number, idx: number) => ({
    time: frameId / fps,
    angle: hipAngles[idx] || 0,
  }));

  const kneeSamples = frameIds.map((frameId: number, idx: number) => ({
    time: frameId / fps,
    angle: kneeAngles[idx] || 0,
  }));

  const ankleSamples = frameIds.map((frameId: number, idx: number) => ({
    time: frameId / fps,
    angle: ankleAngles[idx] || 0,
  }));

  // 轉換相位標記
  const icFrames = pythonResult.ic_frames || [];
  const toFrames = pythonResult.to_frames || [];
  
  const phases: AnalysisPacket['phases'] = [];
  
  // 根據 IC/TO 建立相位標記
  // 這裡需要根據實際的 Python 輸出格式來調整
  const phaseTypes: Array<'initial-contact' | 'loading-response' | 'mid-stance' | 'terminal-stance' | 'pre-swing' | 'initial-swing' | 'mid-swing' | 'terminal-swing'> = [
    'initial-contact',
    'loading-response',
    'mid-stance',
    'terminal-stance',
    'pre-swing',
    'initial-swing',
    'mid-swing',
    'terminal-swing',
  ];

  // 簡化版本：根據 IC 和 TO 建立基本相位
  icFrames.forEach((icFrame: number, idx: number) => {
    const icTime = icFrame / fps;
    phases.push({
      phase: 'initial-contact',
      time: icTime,
      frame: icFrame,
    });

    if (toFrames[idx]) {
      const toTime = toFrames[idx] / fps;
      phases.push({
        phase: 'terminal-stance',
        time: toTime,
        frame: toFrames[idx],
      });
    }
  });

  // 建立標準化資料（這裡使用預設值，實際應該從 Python 結果中取得）
  const norms: AnalysisPacket['norms'] = {};
  phaseTypes.forEach((phase) => {
    norms[phase] = {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    };
  });

  // AI 分析建議（可以從 Python 結果中取得或使用預設值）
  const aiInsights: AnalysisPacket['aiInsights'] = pythonResult.ai_insights || [
    {
      phase: 'initial-contact',
      text: '初始接觸時關節角度正常',
      flags: [],
      severity: 'info',
    },
  ];

  return {
    id: `analysis-${Date.now()}`,
    videoUrl,
    duration,
    phases,
    series: {
      hip: hipSamples,
      knee: kneeSamples,
      ankle: ankleSamples,
    },
    norms,
    aiInsights,
    metadata: {
      recordedAt: new Date().toISOString(),
      subjectId: pythonResult.subject_id || 'unknown',
      notes: pythonResult.notes || '',
    },
    speed: pythonResult.speed,
    cadence: pythonResult.cadence,
    stepLength: pythonResult.step_length,
  };
}

