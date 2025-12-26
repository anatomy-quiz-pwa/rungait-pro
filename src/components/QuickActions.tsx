'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitCompare, FileText, Download } from 'lucide-react';

interface QuickActionsProps {
  onCompare?: () => void;
  onGenerateReport?: () => void;
  onExportData?: () => void;
}

export function QuickActions({ onCompare, onGenerateReport, onExportData }: QuickActionsProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          onClick={onCompare || (() => console.log('Compare clicked'))}
        >
          <GitCompare className="w-4 h-4 mr-2" />
          Compare with Previous
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          onClick={onGenerateReport || (() => console.log('Generate Report clicked'))}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Full Report
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          onClick={onExportData || (() => console.log('Export Data clicked'))}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Raw Data
        </Button>
      </CardContent>
    </Card>
  );
}

