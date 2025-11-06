'use client';

// 強制動態渲染，避免快取
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Download, Home, Loader2 } from 'lucide-react';
import { EnhancedVideoPlayer } from '@/src/components/EnhancedVideoPlayer';
import { AnalysisSummary } from '@/src/components/AnalysisSummary';
import { QuickActions } from '@/src/components/QuickActions';
import type { AnalysisPacket } from '@/src/types/gait';
import { mockAnalysisData } from '@/src/lib/mock';

export default function AnalyzePage() {
  const [analysisData, setAnalysisData] = useState<AnalysisPacket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // 載入 mock 資料（示範用）
  const loadMockData = useCallback(async () => {
    if (analysisData) return;
    
    setIsLoading(true);
    try {
      const data = mockAnalysisData;
      setAnalysisData(data);
      setVideoUrl(data.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData]);

  // 實際上傳並分析影片
  const analyzeVideo = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.useMock || response.status === 503) {
          console.warn('分析服務不可用，使用示範資料');
          const data = mockAnalysisData;
          setAnalysisData(data);
          const url = URL.createObjectURL(file);
          setVideoUrl(url);
          return;
        }
        throw new Error(errorData.error || '分析失敗');
      }

      const data: AnalysisPacket = await response.json();
      setAnalysisData(data);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } catch (error) {
      console.error('分析錯誤:', error);
      alert('分析服務暫時不可用，將顯示示範資料');
      const data = mockAnalysisData;
      setAnalysisData(data);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 處理檔案上傳
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      // 自動開始分析
      analyzeVideo(file);
    } else {
      alert('請上傳影片檔案');
    }
  }, [analyzeVideo]);

  // 處理開始分析（示範模式）
  const handleAnalyze = useCallback(() => {
    loadMockData();
  }, [loadMockData]);

  // 初始化：自動載入示範資料
  useEffect(() => {
    if (!analysisData && !isLoading) {
      loadMockData();
    }
  }, []);

  // 獲取當前相位
  const currentPhase = useMemo(() => {
    if (!analysisData || !analysisData.phases) return undefined;
    // 找到最接近當前時間的相位
    const sortedPhases = [...analysisData.phases].sort((a, b) => a.time - b.time);
    for (let i = sortedPhases.length - 1; i >= 0; i--) {
      if (currentTime >= sortedPhases[i].time) {
        return sortedPhases[i].phase;
      }
    }
    return sortedPhases[0]?.phase;
  }, [analysisData, currentTime]);

  // 處理快速操作
  const handleCompare = useCallback(() => {
    // TODO: 導航到比較頁面
    console.log('Compare with previous');
  }, []);

  const handleGenerateReport = useCallback(() => {
    window.open('/report', '_blank');
  }, []);

  const handleExportData = useCallback(() => {
    if (!analysisData) return;
    const dataStr = JSON.stringify(analysisData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gait-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysisData]);

  const handleExportReport = useCallback(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <Home className="h-5 w-5 text-slate-300" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Gait Analysis</h1>
                <p className="text-sm text-slate-400">Evidence-based running biomechanics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                disabled={isLoading}
                onClick={() => {
                  const input = document.getElementById('video-upload');
                  if (input) {
                    input.click();
                  }
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportReport}
                disabled={!analysisData}
                className="bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-400">Analyzing video...</p>
            </div>
          </div>
        ) : !videoUrl ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-slate-800/50 border-slate-700 p-8 max-w-md">
              <div className="text-center space-y-4">
                <p className="text-slate-300">No video loaded</p>
                <Button 
                  onClick={handleAnalyze} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer"
                  type="button"
                >
                  Load Demo Analysis
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Video Analysis */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <EnhancedVideoPlayer
                  src={videoUrl}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  sessionId={analysisData?.metadata?.recordedAt ? new Date(analysisData.metadata.recordedAt).toISOString().split('T')[0] : undefined}
                />
              </Card>
            </div>

            {/* Right Panel: Analysis Summary & Quick Actions */}
            <div className="space-y-6">
              <AnalysisSummary
                analysisData={analysisData}
                currentPhase={currentPhase}
              />
              <QuickActions
                onCompare={handleCompare}
                onGenerateReport={handleGenerateReport}
                onExportData={handleExportData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
