"use client"

import type { AnalysisPacket } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CitationCard } from "./citation-card"
import { PhaseJointMatrix } from "./phase-joint-matrix"
import { Badge } from "@/components/ui/badge"

interface EvidenceTabsProps {
  analysis: AnalysisPacket
}

export function EvidenceTabs({ analysis }: EvidenceTabsProps) {
  return (
    <Tabs defaultValue="findings" className="w-full">
      <TabsList className="w-full justify-start bg-slate-800/50 border border-slate-700">
        <TabsTrigger value="findings" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
          Findings
        </TabsTrigger>
        <TabsTrigger value="literature" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
          Literature
        </TabsTrigger>
        <TabsTrigger value="data" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
          Data & Methods
        </TabsTrigger>
      </TabsList>

      <TabsContent value="findings" className="space-y-4 mt-4">
        <Card className="p-6 bg-slate-800/30 border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-3">AI Summary</h3>
          <p className="text-slate-300 leading-relaxed">{analysis.aiSummary}</p>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-3">Phase-Joint Analysis</h3>
          <PhaseJointMatrix findings={analysis.findings} />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-100">Key Findings</h3>
          {analysis.findings.map((finding, idx) => (
            <Card key={idx} className="p-4 bg-slate-800/30 border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        finding.status === "abnormal"
                          ? "destructive"
                          : finding.status === "warning"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {finding.phase}
                    </Badge>
                    <span className="text-sm text-slate-400">{finding.joint}</span>
                  </div>
                  <p className="text-slate-200">{finding.description}</p>
                  <p className="text-sm text-slate-400">
                    Measured: {finding.value}° | Normal: {finding.normalRange.min}° to {finding.normalRange.max}°
                  </p>
                </div>
                <Badge
                  className={
                    finding.severity === "high"
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : finding.severity === "medium"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-green-500/20 text-green-300 border-green-500/30"
                  }
                >
                  {finding.severity}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="literature" className="space-y-4 mt-4">
        <p className="text-slate-400 text-sm">
          Evidence-based research supporting the analysis findings and normal range values.
        </p>
        <div className="space-y-3">
          {analysis.citations.map((citation, idx) => (
            <CitationCard key={idx} citation={citation} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="data" className="space-y-4 mt-4">
        <Card className="p-6 bg-slate-800/30 border-slate-700 space-y-4">
          <div>
            <h4 className="font-semibold text-slate-100 mb-2">Dataset</h4>
            <p className="text-sm text-slate-300">{analysis.datasetVersion}</p>
            <p className="text-xs text-slate-400 mt-1">
              Normative ranges derived from elite and recreational runner populations (n=1,247)
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-2">Analysis Pipeline</h4>
            <p className="text-sm text-slate-300">{analysis.modelVersion}</p>
            <p className="text-xs text-slate-400 mt-1">
              Pose estimation with 33 body landmarks, validated against marker-based motion capture
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-2">Limitations</h4>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>2D analysis may not capture frontal plane motion accurately</li>
              <li>Accuracy depends on camera angle and video quality</li>
              <li>Normal ranges are speed-dependent; current speed: {analysis.speed} m/s</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-2">Analysis Parameters</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Speed:</span>
                <span className="ml-2 text-slate-300">{analysis.speed} m/s</span>
              </div>
              <div>
                <span className="text-slate-400">Cadence:</span>
                <span className="ml-2 text-slate-300">{analysis.cadence} steps/min</span>
              </div>
              <div>
                <span className="text-slate-400">Footwear:</span>
                <span className="ml-2 text-slate-300">{analysis.footwear}</span>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>
                <span className="ml-2 text-slate-300">{new Date(analysis.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
