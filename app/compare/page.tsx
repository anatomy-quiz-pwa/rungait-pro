"use client"

import { useState, useMemo, useRef } from "react"
import { createMockAnalysis } from "@/lib/mock-data"
import type { AnalysisPacket, JointType, GaitPhase } from "@/lib/types"
import { VideoPlayer } from "@/components/rungait/video-player"
import { JointChart } from "@/components/rungait/joint-chart"
import { DiffTable } from "@/components/rungait/diff-table"
import { ProvenancePanel } from "@/components/rungait/provenance-panel"
import { ExportMenu } from "@/components/rungait/export-menu"
import { PhaseBar } from "@/components/rungait/phase-bar"
import { PhaseSummaryGrid } from "@/components/compare/phase-summary-grid"
import { KeyImprovements, type Improvement } from "@/components/compare/key-improvements"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight } from "lucide-react"
import { getPhaseWindows, sliceSeries, basicStats, PHASES, JOINT_LABELS } from "@/lib/phase"

export const dynamic = "force-dynamic"

const jointTabs: { value: JointType; label: string }[] = [
  { value: "ankle", label: "Ankle" },
  { value: "knee", label: "Knee" },
  { value: "hip", label: "Hip" },
  { value: "pelvisTilt", label: "Pelvis Tilt" },
  { value: "pelvisDrop", label: "Pelvis Drop" },
  { value: "trunkLean", label: "Trunk Lean" },
  { value: "footProg", label: "Foot Prog" },
]

export default function ComparePage() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [beforeAnalysis] = useState<AnalysisPacket>(() => {
    const analysis = createMockAnalysis("before")
    analysis.speed = 3.2
    analysis.cadence = 168
    return analysis
  })

  const [afterAnalysis] = useState<AnalysisPacket>(() => {
    const analysis = createMockAnalysis("after")
    analysis.speed = 3.5
    analysis.cadence = 172
    analysis.joints = analysis.joints.map((joint) => ({
      ...joint,
      angles: joint.angles.map((point) => ({
        ...point,
        angle: point.angle + (Math.random() - 0.5) * 4,
      })),
    }))
    return analysis
  })

  const [showingBefore, setShowingBefore] = useState(false)
  const [selectedJoint, setSelectedJoint] = useState<JointType>("ankle")
  const [activePhase, setActivePhase] = useState<GaitPhase>("IC")

  const currentAnalysis = showingBefore ? beforeAnalysis : afterAnalysis
  const currentJointData = currentAnalysis.joints.find((j) => j.joint === selectedJoint)
  const compareJointData = (showingBefore ? afterAnalysis : beforeAnalysis).joints.find(
    (j) => j.joint === selectedJoint,
  )

  const phaseWindows = useMemo(() => getPhaseWindows(currentAnalysis.phases), [currentAnalysis.phases])

  const phaseStats = useMemo(() => {
    const afterJoint = afterAnalysis.joints.find((j) => j.joint === selectedJoint)
    const beforeJoint = beforeAnalysis.joints.find((j) => j.joint === selectedJoint)

    if (!afterJoint || !beforeJoint) return {}

    const stats: any = {}
    PHASES.forEach((phase) => {
      const window = phaseWindows[phase]
      if (!window) return

      const afterSlice = sliceSeries(afterJoint.angles, window)
      const beforeSlice = sliceSeries(beforeJoint.angles, window)

      stats[phase] = {
        after: basicStats(afterSlice.map((p) => p.angle)),
        before: basicStats(beforeSlice.map((p) => p.angle)),
      }
    })

    return stats
  }, [afterAnalysis, beforeAnalysis, selectedJoint, phaseWindows])

  const improvements: Improvement[] = useMemo(() => {
    return [
      {
        phase: "IC",
        joint: "ankle",
        text: "Reduced ankle dorsiflexion at initial contact by 3.2°, moving closer to optimal range (5-10°).",
        basedOn: ["official", "pubmed"],
        refs: [
          {
            source: "pubmed",
            cite: "Schache et al., 2014. Running biomechanics and injury risk. J Biomech 47(8):1919-27.",
            url: "https://doi.org/10.1016/j.jbiomech.2014.03.023",
          },
          {
            source: "official",
            cite: 'Standard Running Gait Database - "Ankle Kinematics v2.1"',
          },
        ],
      },
      {
        phase: "TS",
        joint: "hip",
        text: "Improved hip extension during terminal stance by 4.5°, increasing propulsive efficiency.",
        basedOn: ["official"],
        refs: [
          {
            source: "official",
            cite: 'Standard Database PDF: "Hip Extension Norms for Distance Runners"',
          },
        ],
      },
      {
        phase: "MS",
        joint: "knee",
        text: "Reduced excessive knee flexion in mid-stance, decreasing loading stress on patellofemoral joint.",
        basedOn: ["pubmed", "personal"],
        refs: [
          {
            source: "pubmed",
            cite: "Novacheck, 1998. The biomechanics of running. Gait Posture 7(1):77-95.",
            url: "https://doi.org/10.1016/S0966-6362(97)00038-6",
          },
          {
            source: "personal",
            cite: "Personal note: Coach feedback from 2024-11-15 session",
          },
        ],
      },
    ]
  }, [])

  const handlePhaseClick = (phase: GaitPhase) => {
    setActivePhase(phase)
    const window = phaseWindows[phase]
    if (window && videoRef.current) {
      // Convert percent to time (assuming 2 second video duration for mock)
      const duration = 2
      const seekTime = (window.start / 100) * duration
      videoRef.current.currentTime = seekTime
    }
  }

  const handleExportPDF = () => {
    alert("PDF export would be implemented here")
  }

  const handleExportCSV = () => {
    alert("CSV export would be implemented here")
  }

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance">Before/After Comparison</h1>
            <p className="text-slate-400 mt-1">Track progress and measure improvements</p>
          </div>
          <ExportMenu onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} />
        </div>

        <div className="mb-6">
          <PhaseBar phases={currentAnalysis.phases} currentPhase={activePhase} onPhaseClick={handlePhaseClick} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={showingBefore ? "default" : "outline"}
                  className={showingBefore ? "bg-red-500 text-white" : "border-red-500/30 text-red-400"}
                >
                  Before
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingBefore(!showingBefore)}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
                <Badge
                  variant={!showingBefore ? "default" : "outline"}
                  className={!showingBefore ? "bg-cyan-500 text-white" : "border-cyan-500/30 text-cyan-400"}
                >
                  After
                </Badge>
              </div>
              <div className="text-sm text-slate-400">
                {currentAnalysis.speed} m/s · {currentAnalysis.cadence} spm
              </div>
            </div>
            <VideoPlayer videoUrl={currentAnalysis.videoUrl} phases={currentAnalysis.phases} videoRef={videoRef} />
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="mb-4 text-sm text-slate-300">
              Currently viewing: <span className="font-semibold text-cyan-400">{activePhase}</span> —{" "}
              <span className="font-semibold text-cyan-400">{JOINT_LABELS[selectedJoint]}</span>
            </div>

            <Tabs value={selectedJoint} onValueChange={(v) => setSelectedJoint(v as JointType)}>
              <TabsList className="w-full justify-start bg-slate-800 border border-slate-700 flex-wrap h-auto">
                {jointTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {jointTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                  {currentJointData && (
                    <JointChart
                      jointData={currentJointData}
                      compareData={compareJointData}
                      phaseWindow={phaseWindows[activePhase]}
                      phaseLabel={activePhase}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <PhaseSummaryGrid phases={PHASES} stats={phaseStats} activeJoint={selectedJoint} />

          <div>
            <h2 className="text-2xl font-semibold mb-4">Comparison Summary</h2>
            <DiffTable beforeAnalysis={beforeAnalysis} afterAnalysis={afterAnalysis} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Analysis Provenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400 mb-2">Before</div>
                <ProvenancePanel
                  datasetVersion={beforeAnalysis.datasetVersion}
                  speed={beforeAnalysis.speed}
                  footwear={beforeAnalysis.footwear}
                />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">After</div>
                <ProvenancePanel
                  datasetVersion={afterAnalysis.datasetVersion}
                  speed={afterAnalysis.speed}
                  footwear={afterAnalysis.footwear}
                />
              </div>
            </div>
          </div>

          <KeyImprovements items={improvements} />
        </div>
      </div>
    </div>
  )
}
