'use client';

// 強制動態渲染，避免快取
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/src/components/VideoPlayer';
import { JointChart } from '@/src/components/JointChart';
import { AiInsights } from '@/src/components/AiInsights';
import { ProvenancePanel } from '@/src/components/ProvenancePanel';
import { CitationCard } from '@/src/components/CitationCard';
import { Upload, FileVideo, Loader2, PlayCircle, Download, Activity, Gauge, Ruler } from 'lucide-react';
import type { AnalysisPacket, JointKey } from '@/src/types/gait';
import { mockAnalysisData, mockDatasets, mockPipeline, mockCitations } from '@/src/lib/mock';

export default function AnalyzePage() {
  const [analysisData, setAnalysisData] = useState<AnalysisPacket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState<JointKey>('hip');
  const [currentTime, setCurrentTime] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // 載入 mock 資料（示範用）
  const loadMockData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 直接從 mock.ts 讀取資料
      const data = mockAnalysisData;
      setAnalysisData(data);
      setVideoUrl(data.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 實際上傳並分析影片
  const analyzeVideo = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      // 建立 FormData 來上傳影片
      const formData = new FormData();
      formData.append('video', file);

      // 調用分析 API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 如果 API 返回 useMock 標記，使用 mock 資料
        if (errorData.useMock || response.status === 503) {
          console.warn('分析服務不可用，使用示範資料');
          await loadMockData();
          return;
        }
        
        throw new Error(errorData.error || '分析失敗');
      }

      const data: AnalysisPacket = await response.json();
      setAnalysisData(data);
      
      // 使用上傳的影片 URL
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } catch (error) {
      console.error('分析錯誤:', error);
      // 發生錯誤時，回退到 mock 資料
      alert('分析服務暫時不可用，將顯示示範資料');
      await loadMockData();
    } finally {
      setIsLoading(false);
    }
  }, [loadMockData]);

  // 處理檔案上傳
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      // 不自動分析，等待用戶點擊「開始分析」按鈕
    } else {
      alert('請上傳影片檔案');
    }
  }, []);

  // 處理開始分析
  const handleAnalyze = useCallback(() => {
    if (videoFile) {
      // 如果有上傳的檔案，進行實際分析
      analyzeVideo(videoFile);
    } else {
      // 如果沒有檔案，載入示範資料
      loadMockData();
    }
  }, [videoFile, analyzeVideo, loadMockData]);

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

  // PDF 匯出功能
  const handleDownloadPDF = useCallback(() => {
    // 在實際應用中，這裡會使用 jsPDF 或 react-pdf 來生成 PDF
    alert('PDF 匯出功能將在此實作（使用 jsPDF 或 react-pdf）');
  }, []);

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
              <CardTitle>步態分析</CardTitle>
              <CardDescription>
                上傳您的步態影片進行分析，或查看示範分析結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 space-y-6">
                {isLoading ? (
                  <>
                    <Loader2 className="w-16 h-16 text-slate-400 animate-spin" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      分析中，請稍候...
                    </p>
                  </>
                ) : (
                  <>
                    <FileVideo className="w-20 h-20 text-slate-400" />
                    <div className="text-center space-y-4 max-w-md">
                      <p className="text-lg font-medium text-slate-900 dark:text-slate-50">
                        開始步態分析
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        您可以上傳影片檔案，或直接查看示範分析結果
                      </p>
                      
                      {/* 主要操作按鈕 */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Button
                          onClick={handleAnalyze}
                          size="lg"
                          className="min-w-[200px]"
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          開始分析（示範）
                        </Button>
                        <label htmlFor="video-upload">
                          <Button 
                            asChild 
                            variant="outline" 
                            size="lg"
                            className="min-w-[200px] cursor-pointer"
                          >
                            <span>
                              <Upload className="w-5 h-5 mr-2" />
                              上傳影片
                            </span>
                          </Button>
                        </label>
                      </div>
                      
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {videoFile && (
                        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            已選擇檔案：<span className="font-medium">{videoFile.name}</span>
                          </p>
                          <Button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="w-full"
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分析結果區域 */}
        {analysisData && (
          <div className="space-y-6">
            {/* Clinical Summary Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Clinical Summary</CardTitle>
                    <CardDescription className="mt-2">
                      步態分析臨床報告 - {analysisData.metadata.subjectId || 'N/A'}
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownloadPDF} variant="default">
                    <Download className="w-4 h-4 mr-2" />
                    匯出 PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Gait Metrics */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  {analysisData.speed !== undefined && (
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">速度</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {analysisData.speed.toFixed(2)} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">m/s</span>
                      </p>
                    </div>
                  )}
                  {analysisData.cadence !== undefined && (
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">步頻</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {analysisData.cadence} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">steps/min</span>
                      </p>
                    </div>
                  )}
                  {analysisData.stepLength !== undefined && (
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Ruler className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">步長</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {analysisData.stepLength.toFixed(2)} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">m</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-semibold">記錄時間：</span>
                    {new Date(analysisData.metadata.recordedAt).toLocaleString('zh-TW')}
                  </div>
                  {analysisData.metadata.notes && (
                    <div>
                      <span className="font-semibold">備註：</span>
                      {analysisData.metadata.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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

            {/* Evidence Panels */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Evidence Base</h2>
              
              {/* Methodology & Data Sources */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Methods</h3>
                <ProvenancePanel datasets={mockDatasets} pipeline={mockPipeline} />
              </div>

              {/* Literature */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Literature</h3>
                <div className="space-y-3">
                  {mockCitations.map((citation, idx) => (
                    <CitationCard key={idx} {...citation} />
                  ))}
                </div>
              </div>

              {/* Dataset */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Dataset</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {mockDatasets.map((dataset, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">{dataset.name}</p>
                            <Badge variant="outline" className="text-xs font-mono">
                              {dataset.version}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">最後更新：{dataset.lastUpdate}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 重新上傳按鈕 */}
            <div className="flex justify-center pt-4">
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

