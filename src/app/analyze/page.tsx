'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlayer } from '@/src/components/VideoPlayer';
import { JointChart } from '@/src/components/JointChart';
import { AiInsights } from '@/src/components/AiInsights';
import { Upload, FileVideo, Loader2 } from 'lucide-react';
import type { AnalysisPacket, JointKey, GaitPhaseId } from '@/src/types/gait';

export default function AnalyzePage() {
  const [analysisData, setAnalysisData] = useState<AnalysisPacket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState<JointKey>('hip');
  const [currentTime, setCurrentTime] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // 載入 mock 資料
  const loadMockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mock?type=analysis');
      const data: AnalysisPacket = await response.json();
      setAnalysisData(data);
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error);
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
      // 上傳後自動載入分析資料（模擬）
      loadMockData();
    } else {
      alert('請上傳影片檔案');
    }
  }, [loadMockData]);

  // 處理開始分析
  const handleAnalyze = useCallback(() => {
    if (videoFile) {
      loadMockData();
    } else {
      alert('請先上傳影片');
    }
  }, [videoFile, loadMockData]);

  // 取得當前相位的 normBand
  const currentNormBand = useMemo(() => {
    if (!analysisData) return undefined;
    
    const currentPhase = analysisData.phases.find(
      (phase) => currentTime >= phase.time && 
      (analysisData.phases[analysisData.phases.indexOf(phase) + 1]?.time ?? analysisData.duration) > currentTime
    );
    
    if (!currentPhase) return undefined;
    
    return analysisData.norms[currentPhase.phase]?.[selectedJoint];
  }, [analysisData, currentTime, selectedJoint]);

  // 準備相位標記
  const phaseMarkers = useMemo(() => {
    if (!analysisData) return [];
    return analysisData.phases.map((phase) => ({
      time: phase.time,
      label: phase.phase,
    }));
  }, [analysisData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 標題區域 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            步態分析系統
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            上傳您的步態影片，獲得專業的分析報告
          </p>
        </div>

        {/* 上傳區域 */}
        {!analysisData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>上傳影片</CardTitle>
              <CardDescription>
                支援 MP4、MOV、AVI 等常見影片格式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 space-y-4">
                <FileVideo className="w-16 h-16 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    點擊上傳或拖放影片檔案
                  </p>
                  <label htmlFor="video-upload">
                    <Button asChild className="cursor-pointer">
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        選擇影片
                      </span>
                    </Button>
                  </label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {videoFile && (
                  <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                    <p>已選擇：{videoFile.name}</p>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="mt-4"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        '開始分析'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分析結果區域 */}
        {analysisData && (
          <div className="space-y-6">
            {/* 影片播放器 */}
            <Card>
              <CardHeader>
                <CardTitle>影片播放</CardTitle>
                <CardDescription>
                  播放您的步態影片，時間軸會同步顯示分析結果
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlayer
                  src={videoUrl || analysisData.videoUrl}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                />
              </CardContent>
            </Card>

            {/* 關節角度圖表 */}
            <Card>
              <CardHeader>
                <CardTitle>關節角度分析</CardTitle>
                <CardDescription>
                  選擇不同關節查看角度變化趨勢
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedJoint} onValueChange={(v) => setSelectedJoint(v as JointKey)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hip">髖關節</TabsTrigger>
                    <TabsTrigger value="knee">膝關節</TabsTrigger>
                    <TabsTrigger value="ankle">踝關節</TabsTrigger>
                  </TabsList>
                  <TabsContent value={selectedJoint} className="mt-4">
                    <JointChart
                      data={analysisData.series[selectedJoint]}
                      normBand={currentNormBand}
                      jointName={selectedJoint}
                      phaseMarkers={phaseMarkers}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* AI 分析建議 */}
            <AiInsights insights={analysisData.aiInsights} />

            {/* 重新上傳按鈕 */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysisData(null);
                  setVideoFile(null);
                  setVideoUrl('');
                  setCurrentTime(0);
                }}
              >
                重新上傳影片
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

