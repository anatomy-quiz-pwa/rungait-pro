'use client';

// 強制動態渲染，避免快取
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Home, Loader2 } from 'lucide-react';
import { EnhancedVideoPlayer } from '@/src/components/EnhancedVideoPlayer';
import { AnalysisSummary } from '@/src/components/AnalysisSummary';
import { QuickActions } from '@/src/components/QuickActions';
import { PhaseBar, type GaitPhase } from '@/components/phase-bar';
import { JointChart } from '@/src/components/JointChart';
import { AiInsights } from '@/src/components/AiInsights';
import { ProvenancePanel } from '@/src/components/ProvenancePanel';
import { CitationCard } from '@/src/components/CitationCard';
import type { AnalysisPacket, JointKey } from '@/src/types/gait';
import { mockAnalysisData, mockDatasets, mockPipeline, mockCitations } from '@/src/lib/mock';

type DataTab = 'kinematics' | 'findings' | 'evidence';
type JointTab = 'ankle' | 'knee' | 'hip' | 'pelvis-tilt' | 'trunk-lean';

export default function AnalyzePage() {
  const [analysisData, setAnalysisData] = useState<AnalysisPacket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<GaitPhase>('IC');
  const [dataTab, setDataTab] = useState<DataTab>('kinematics');
  const [jointTab, setJointTab] = useState<JointTab>('ankle');

  // 載入 mock 資料（示範用）
  const loadMockData = useCallback(async () => {
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
  }, []);

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
    console.log('File selected:', file);
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    if (file.type.startsWith('video/')) {
      console.log('Video file detected, starting upload...');
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      // 自動開始分析
      analyzeVideo(file);
    } else {
      alert('請上傳影片檔案');
      // 重置 input
      event.target.value = '';
    }
  }, [analyzeVideo]);

  // 處理開始分析（示範模式）
  const handleAnalyze = useCallback(() => {
    loadMockData();
  }, [loadMockData]);

  // 初始化：自動載入示範資料
  useEffect(() => {
    // 只在首次載入時執行
    if (!analysisData && !isLoading && !videoUrl) {
      console.log('Auto-loading mock data...');
      loadMockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在 mount 時執行一次

  // 獲取當前相位
  const currentPhase = useMemo(() => {
    if (!analysisData || !analysisData.phases) return undefined;
    // 找到最接近當前時間的相位
    const sortedPhases = [...analysisData.phases].sort((a, b) => a.time - b.time);
    for (let i = sortedPhases.length - 1; i >= 0; i--) {
      if (currentTime >= sortedPhases[i].time) {
        const phaseMap: Record<string, GaitPhase> = {
          'initial-contact': 'IC',
          'loading-response': 'LR',
          'mid-stance': 'MS',
          'terminal-stance': 'TS',
          'pre-swing': 'PSw',
          'initial-swing': 'ISw',
          'mid-swing': 'MidSw',
          'terminal-swing': 'TSw',
        };
        return phaseMap[sortedPhases[i].phase] || 'IC';
      }
    }
    return 'IC';
  }, [analysisData, currentTime]);

  // 處理相位點擊
  const handlePhaseClick = useCallback((phase: GaitPhase) => {
    setSelectedPhase(phase);
    if (analysisData) {
      const phaseMap: Record<GaitPhase, string> = {
        'IC': 'initial-contact',
        'LR': 'loading-response',
        'MS': 'mid-stance',
        'TS': 'terminal-stance',
        'PSw': 'pre-swing',
        'ISw': 'initial-swing',
        'MidSw': 'mid-swing',
        'TSw': 'terminal-swing',
      };
      const phaseData = analysisData.phases.find(p => p.phase === phaseMap[phase]);
      if (phaseData) {
        setCurrentTime(phaseData.time);
      }
    }
  }, [analysisData]);

  // 準備相位標記
  const phaseMarkers = useMemo(() => {
    if (!analysisData) return [];
    return analysisData.phases.map((phase) => ({
      time: phase.time,
      label: phase.phase,
    }));
  }, [analysisData]);

  // 獲取當前相位的正常範圍
  const currentNormBand = useMemo(() => {
    if (!analysisData || !selectedPhase) return undefined;
    const phaseMap: Record<GaitPhase, string> = {
      'IC': 'initial-contact',
      'LR': 'loading-response',
      'MS': 'mid-stance',
      'TS': 'terminal-stance',
      'PSw': 'pre-swing',
      'ISw': 'initial-swing',
      'MidSw': 'mid-swing',
      'TSw': 'terminal-swing',
    };
    const phaseId = phaseMap[selectedPhase];
    const jointKey = jointTab === 'pelvis-tilt' ? 'hip' : jointTab === 'trunk-lean' ? 'hip' : jointTab as JointKey;
    return analysisData.norms[phaseId]?.[jointKey];
  }, [analysisData, selectedPhase, jointTab]);

  // 處理快速操作
  const handleCompare = useCallback(() => {
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

  // 獲取關節當前角度和狀態
  const getJointStatus = useCallback((joint: JointTab, angle: number) => {
    if (!currentNormBand) return { status: 'OK', label: 'OK' };
    if (angle < currentNormBand.min || angle > currentNormBand.max) {
      return { status: 'Risk', label: 'Risk' };
    }
    const diff = Math.abs(angle - currentNormBand.mean);
    if (diff > currentNormBand.std * 1.5) {
      return { status: 'Warning', label: 'Warning' };
    }
    return { status: 'OK', label: 'OK' };
  }, [currentNormBand]);

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
            <div className="flex items-center gap-2 relative z-50">
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                style={{ position: 'absolute', visibility: 'hidden' }}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer relative z-50"
                disabled={isLoading}
                type="button"
                onClick={(e) => {
                  console.log('Upload button clicked');
                  e.preventDefault();
                  e.stopPropagation();
                  const input = document.getElementById('video-upload') as HTMLInputElement;
                  console.log('Input element:', input);
                  if (input) {
                    input.click();
                    console.log('Input click triggered');
                  } else {
                    console.error('Video upload input not found');
                  }
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  console.log('Export Report button clicked');
                  e.preventDefault();
                  e.stopPropagation();
                  handleExportReport();
                }}
                disabled={!analysisData}
                className="bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer relative z-50"
                type="button"
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
        ) : !videoUrl || !analysisData ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-slate-800/50 border-slate-700 p-8 max-w-md">
              <div className="text-center space-y-4">
                <p className="text-slate-300">No video loaded</p>
                <Button 
                  onClick={(e) => {
                    console.log('Load Demo button clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    handleAnalyze();
                  }} 
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
            {/* Left Panel: Video Analysis & Data */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Analysis */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <EnhancedVideoPlayer
                  src={videoUrl}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  sessionId={analysisData?.metadata?.recordedAt ? new Date(analysisData.metadata.recordedAt).toISOString().split('T')[0] : undefined}
                />
              </Card>

              {/* Gait Phase Selection */}
              {analysisData && (
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <CardHeader>
                    <CardTitle className="text-white">Gait Phase Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PhaseBar
                      currentPhase={selectedPhase || currentPhase}
                      onPhaseClick={handlePhaseClick}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Data Display Section */}
              {analysisData && (
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <Tabs value={dataTab} onValueChange={(v) => setDataTab(v as DataTab)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="kinematics">Joint Kinematics</TabsTrigger>
                      <TabsTrigger value="findings">Findings</TabsTrigger>
                      <TabsTrigger value="evidence">Evidence Base</TabsTrigger>
                    </TabsList>

                    {/* Joint Kinematics Tab */}
                    <TabsContent value="kinematics" className="space-y-6 mt-6">
                      {/* Joint Navigation */}
                      <div className="flex gap-2 flex-wrap">
                        {(['ankle', 'knee', 'hip', 'pelvis-tilt', 'trunk-lean'] as JointTab[]).map((joint) => (
                          <Button
                            key={joint}
                            variant={jointTab === joint ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setJointTab(joint)}
                            className={jointTab === joint ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                          >
                            {joint.charAt(0).toUpperCase() + joint.slice(1).replace('-', ' ')}
                          </Button>
                        ))}
                      </div>

                      {/* Joint Charts */}
                      {(['ankle', 'knee', 'hip'] as JointTab[]).includes(jointTab) && (
                        <div className="space-y-4">
                          {analysisData.series[jointTab as JointKey] && (
                            <div className="space-y-4">
                              <Card className="bg-slate-700/50 border-slate-600">
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-white capitalize">{jointTab}</CardTitle>
                                    {(() => {
                                      const currentAngle = analysisData.series[jointTab as JointKey]?.[Math.floor(currentTime * 10)]?.angle || 0;
                                      const status = getJointStatus(jointTab, currentAngle);
                                      return (
                                        <Badge
                                          variant={status.status === 'OK' ? 'secondary' : status.status === 'Warning' ? 'default' : 'destructive'}
                                          className={
                                            status.status === 'OK'
                                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                              : status.status === 'Warning'
                                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                                                : 'bg-red-500/20 text-red-400 border-red-500/50'
                                          }
                                        >
                                          {status.label}
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-sm text-slate-400">
                                    {analysisData.series[jointTab as JointKey]?.[Math.floor(currentTime * 10)]?.angle.toFixed(1) || '0.0'}°
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  <JointChart
                                    data={analysisData.series[jointTab as JointKey]}
                                    normBand={currentNormBand}
                                    jointName={jointTab}
                                    phaseMarkers={phaseMarkers}
                                  />
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Findings Tab */}
                    <TabsContent value="findings" className="mt-6">
                      <AiInsights insights={analysisData.aiInsights} />
                    </TabsContent>

                    {/* Evidence Base Tab */}
                    <TabsContent value="evidence" className="mt-6 space-y-6">
                      <ProvenancePanel datasets={mockDatasets} pipeline={mockPipeline} />
                      <div className="space-y-3">
                        {mockCitations.map((citation, idx) => (
                          <CitationCard key={idx} {...citation} />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              )}
            </div>

            {/* Right Panel: Analysis Summary & Quick Actions */}
            <div className="space-y-6">
              <AnalysisSummary
                analysisData={analysisData}
                currentPhase={selectedPhase || currentPhase}
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
