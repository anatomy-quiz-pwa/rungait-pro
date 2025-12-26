'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import type { AnalysisPacket } from '@/src/types/gait';

interface AnalysisSummaryProps {
  analysisData: AnalysisPacket | null;
  currentPhase?: string;
}

export function AnalysisSummary({ analysisData, currentPhase }: AnalysisSummaryProps) {
  if (!analysisData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">No analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  // 計算狀態統計
  const statusCounts = {
    ok: analysisData.aiInsights.filter(i => i.severity === 'info').length,
    warning: analysisData.aiInsights.filter(i => i.severity === 'warning').length,
    risk: analysisData.aiInsights.filter(i => i.severity === 'error').length,
  };

  const totalFindings = analysisData.aiInsights.length;
  const riskLevel = statusCounts.risk > 0 ? 'High' : statusCounts.warning > 0 ? 'Moderate' : 'Low';

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Current Phase</span>
            <span className="text-sm font-semibold text-white">{currentPhase || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Findings</span>
            <span className="text-sm font-semibold text-white">{totalFindings}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Risk Level</span>
            <Badge
              variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Moderate' ? 'default' : 'secondary'}
              className={
                riskLevel === 'High'
                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                  : riskLevel === 'Moderate'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                    : 'bg-green-500/20 text-green-400 border-green-500/50'
              }
            >
              {riskLevel}
            </Badge>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">STATUS BREAKDOWN</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">OK</span>
              </div>
              <span className="text-sm font-semibold text-white">{statusCounts.ok}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-slate-300">Warning</span>
              </div>
              <span className="text-sm font-semibold text-white">{statusCounts.warning}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">Risk</span>
              </div>
              <span className="text-sm font-semibold text-white">{statusCounts.risk}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

