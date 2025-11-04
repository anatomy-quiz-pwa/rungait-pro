'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AiSnippet } from '../types/gait';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface AiInsightsProps {
  insights: AiSnippet[];
}

const severityConfig = {
  info: {
    icon: Info,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
  },
  warning: {
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  error: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
  },
};

export function AiInsights({ insights }: AiInsightsProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI 分析建議</CardTitle>
          <CardDescription>目前沒有分析結果</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 分析建議</CardTitle>
        <CardDescription>根據步態分析結果提供的建議</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, idx) => {
          const config = severityConfig[insight.severity];
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${config.color} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor} flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.phase}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{insight.text}</p>
                  {insight.flags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {insight.flags.map((flag, flagIdx) => (
                        <Badge
                          key={flagIdx}
                          variant="outline"
                          className="text-xs bg-white/50"
                        >
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

