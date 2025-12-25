"use client"

import { useState, useMemo, useEffect } from "react"
import { createMockEvidenceRecommendations, createMockLiteratureCitations } from "@/lib/mock-data"
import { getAnalysisWithMeta, reanalyzeWithLibraries } from "@/lib/analysis"
import { consumeOneCredit } from "@/lib/credits"
import { loadUserLibrarySelection } from "@/lib/library"
import type { AnalysisPacketWithMeta, GaitPhase, JointType, EvidenceLevel } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, LinkIcon, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { CitationCard } from "@/components/rungait/citation-card"
import { EvidenceRecommendations } from "@/components/rungait/evidence-recommendations"
import { CitationsList } from "@/components/rungait/citations-list"
import { EvidenceFilters } from "@/components/rungait/evidence-filters"
import { NormsCompare } from "@/components/report/norms-compare"
import { CaseInfoForm } from "@/components/report/case-info-form"
import { RefreshCw, Database } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"

const phaseLabels: Record<GaitPhase, string> = {
  IC: "Initial Contact",
  LR: "Loading Response",
  MS: "Mid Stance",
  TS: "Terminal Stance",
  PSw: "Pre-Swing",
  ISw: "Initial Swing",
  MidSw: "Mid Swing",
  TSw: "Terminal Swing",
}

const jointLabels: Record<JointType, string> = {
  ankle: "Ankle",
  knee: "Knee",
  hip: "Hip",
  pelvisTilt: "Pelvis Tilt",
  pelvisDrop: "Pelvis Drop",
  trunkLean: "Trunk Lean",
  footProg: "Foot Progression",
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const { t } = useI18n()
  const { id } = params
  const [analysis, setAnalysis] = useState<AnalysisPacketWithMeta | null>(null)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [filterPhases, setFilterPhases] = useState<GaitPhase[]>([])
  const [filterJoints, setFilterJoints] = useState<JointType[]>([])
  const [filterEvidenceLevel, setFilterEvidenceLevel] = useState<EvidenceLevel | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightedCitation, setHighlightedCitation] = useState<string | undefined>()

  const recommendations = useMemo(() => createMockEvidenceRecommendations(analysis), [analysis])
  const citations = useMemo(() => createMockLiteratureCitations(), [])

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      if (filterPhases.length > 0 && !filterPhases.includes(rec.phase)) return false
      if (filterJoints.length > 0 && !rec.joints.some((j) => filterJoints.includes(j))) return false

      const recCitations = rec.citationIds.map((id) => citations.find((c) => c.id === id)).filter(Boolean)
      if (filterEvidenceLevel !== "all" && !recCitations.some((c) => c?.evidenceLevel === filterEvidenceLevel)) {
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesRec = rec.recommendation.toLowerCase().includes(query)
        const matchesCitation = recCitations.some(
          (c) =>
            c?.author.toLowerCase().includes(query) ||
            c?.year.toString().includes(query) ||
            c?.doi?.toLowerCase().includes(query),
        )
        if (!matchesRec && !matchesCitation) return false
      }

      return true
    })
  }, [recommendations, citations, filterPhases, filterJoints, filterEvidenceLevel, searchQuery])

  const filteredCitations = useMemo(() => {
    const citationIds = new Set(filteredRecommendations.flatMap((rec) => rec.citationIds))
    return citations.filter((c) => citationIds.has(c.id))
  }, [citations, filteredRecommendations])

  const handleCitationClick = (citationId: string) => {
    const element = document.getElementById(`citation-${citationId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      setHighlightedCitation(citationId)
      setTimeout(() => setHighlightedCitation(undefined), 2000)
    }
  }

  const handleExportEvidence = () => {
    alert("Export Evidence to PDF would be implemented here")
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    alert("PDF download would be implemented here")
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard")
    }
  }

  const StatusIcon = ({ status }: { status: "normal" | "warning" | "abnormal" }) => {
    switch (status) {
      case "normal":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "abnormal":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const handleReanalyze = async () => {
    if (!analysis) return

    if (!confirm("重新分析將消耗 3 點。確定要繼續嗎？")) return

    setReanalyzing(true)
    try {
      // Consume 3 credits
      await consumeOneCredit({ flow: "reanalysis", analysis_id: id })
      await consumeOneCredit({ flow: "reanalysis", analysis_id: id })
      await consumeOneCredit({ flow: "reanalysis", analysis_id: id })

      // Get selected sources
      const selection = await loadUserLibrarySelection()
      const selectedSources = Array.from(selection.entries())
        .filter(([_, selected]) => selected)
        .map(([id]) => id)

      // Trigger reanalysis
      await reanalyzeWithLibraries(id, selectedSources)

      alert(t("reanalyzed"))
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error: any) {
      if (error.message === "INSUFFICIENT_CREDITS") {
        alert("點數不足，請先購買點數")
      } else {
        alert("重新分析失敗：" + error.message)
      }
    } finally {
      setReanalyzing(false)
    }
  }

  useEffect(() => {
    const loadAnalysis = async () => {
      const data = await getAnalysisWithMeta(id)
      setAnalysis(data)
    }
    loadAnalysis()
  }, [id])

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#0B0F12] flex items-center justify-center">
        <div className="text-slate-400">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold">Clinical Report</h1>
            <p className="text-slate-400 mt-1">Analysis #{id}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-700 print:hidden">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Evidence & Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CaseInfoForm analysisId={id} initialData={analysis.case_meta} />

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">{t("databasesUsed")}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(analysis.library_sources || ["official"]).map((source) => (
                      <Badge key={source} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {source === "official"
                          ? t("official")
                          : source === "pubmed"
                            ? t("pubmed")
                            : source === "personal"
                              ? t("personal")
                              : source}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${reanalyzing ? "animate-spin" : ""}`} />
                  {reanalyzing ? t("reanalyzing") : t("reanalyze")}
                </Button>
              </div>
            </Card>

            {/* Report Header */}
            <Card className="p-8 bg-slate-900/50 border-slate-700 print:bg-white print:text-black print:border-gray-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold print:text-black">Running Gait Analysis Report</h2>
                  <p className="text-slate-400 mt-1 print:text-gray-600">
                    Generated:{" "}
                    {new Date(analysis.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 print:bg-cyan-100 print:text-cyan-800">
                  Report #{id}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-slate-400 print:text-gray-600">Speed</div>
                  <div className="text-lg font-semibold print:text-black">{analysis.speed} m/s</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 print:text-gray-600">Cadence</div>
                  <div className="text-lg font-semibold print:text-black">{analysis.cadence} spm</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 print:text-gray-600">Footwear</div>
                  <div className="text-lg font-semibold print:text-black">{analysis.footwear}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 print:text-gray-600">Dataset</div>
                  <div className="text-sm font-medium print:text-black">{analysis.datasetVersion}</div>
                </div>
              </div>
            </Card>

            {/* AI Summary */}
            <Card className="p-6 bg-slate-900/50 border-slate-700 print:bg-white print:text-black print:border-gray-300">
              <h3 className="text-xl font-semibold mb-4 print:text-black">Executive Summary</h3>
              <p className="text-slate-300 leading-relaxed print:text-gray-800">{analysis.aiSummary}</p>
            </Card>

            {/* Phase Overview */}
            <Card className="p-6 bg-slate-900/50 border-slate-700 print:bg-white print:text-black print:border-gray-300">
              <h3 className="text-xl font-semibold mb-4 print:text-black">Gait Phase Overview</h3>
              <div className="rounded-xl border border-slate-700 overflow-hidden print:border-gray-300">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 print:bg-gray-100">
                      <TableHead className="text-slate-300 font-semibold print:text-black">Phase</TableHead>
                      <TableHead className="text-slate-300 font-semibold print:text-black">Description</TableHead>
                      <TableHead className="text-center text-slate-300 font-semibold print:text-black">
                        Duration
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.phases.map((phase) => (
                      <TableRow key={phase.phase} className="border-slate-700 print:border-gray-300">
                        <TableCell className="font-medium text-slate-200 print:text-black">{phase.phase}</TableCell>
                        <TableCell className="text-slate-300 print:text-gray-700">{phaseLabels[phase.phase]}</TableCell>
                        <TableCell className="text-center text-slate-300 print:text-gray-700">
                          {phase.startPercent}% - {phase.endPercent}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Database Comparison */}
            <NormsCompare packet={analysis} norms={[]} />

            {/* Key Findings */}
            <Card className="p-6 bg-slate-900/50 border-slate-700 print:bg-white print:text-black print:border-gray-300 print:break-inside-avoid">
              <h3 className="text-xl font-semibold mb-4 print:text-black">Key Findings</h3>
              <div className="space-y-4">
                {analysis.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 print:bg-gray-50 print:border-gray-300"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={finding.status} />
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 print:bg-cyan-100 print:text-cyan-800">
                              {finding.phase}
                            </Badge>
                            <span className="text-sm text-slate-400 print:text-gray-600">
                              {jointLabels[finding.joint]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={
                          finding.severity === "high"
                            ? "bg-red-500/20 text-red-300 border-red-500/30 print:bg-red-100 print:text-red-800"
                            : finding.severity === "medium"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30 print:bg-amber-100 print:text-amber-800"
                              : "bg-green-500/20 text-green-300 border-green-500/30 print:bg-green-100 print:text-green-800"
                        }
                      >
                        {finding.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-300 mb-2 print:text-gray-800">{finding.description}</p>
                    <p className="text-sm text-slate-400 print:text-gray-600">
                      Measured: {finding.value}° | Normal Range: {finding.normalRange.min}° to {finding.normalRange.max}
                      °
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Evidence Appendix */}
            <div className="print:break-before-page">
              <Card className="p-6 bg-slate-900/50 border-slate-700 print:bg-white print:text-black print:border-gray-300">
                <h3 className="text-xl font-semibold mb-4 print:text-black">Evidence Appendix</h3>

                <h4 className="text-lg font-semibold mb-3 print:text-black">Literature References</h4>
                <div className="space-y-3 mb-6">
                  {analysis.citations.map((citation, idx) => (
                    <div key={idx} className="print:break-inside-avoid">
                      <CitationCard citation={citation} />
                    </div>
                  ))}
                </div>

                <h4 className="text-lg font-semibold mb-3 print:text-black">Data & Methods</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-200 print:text-black">Dataset: </span>
                    <span className="text-slate-300 print:text-gray-700">{analysis.datasetVersion}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-200 print:text-black">Model: </span>
                    <span className="text-slate-300 print:text-gray-700">{analysis.modelVersion}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-200 print:text-black">Limitations: </span>
                    <span className="text-slate-300 print:text-gray-700">
                      2D analysis, camera angle dependent, speed-specific norms
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Evidence & Recommendations</h2>
                <p className="text-slate-400 mt-1">AI-extracted recommendations with scientific literature support</p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportEvidence}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Evidence
              </Button>
            </div>

            <EvidenceFilters
              phases={filterPhases}
              joints={filterJoints}
              evidenceLevel={filterEvidenceLevel}
              searchQuery={searchQuery}
              onPhasesChange={setFilterPhases}
              onJointsChange={setFilterJoints}
              onEvidenceLevelChange={setFilterEvidenceLevel}
              onSearchChange={setSearchQuery}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">AI Recommendations</h3>
                  <EvidenceRecommendations
                    items={filteredRecommendations}
                    citations={citations}
                    onCitationClick={handleCitationClick}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Citations Detail</h3>
                  <CitationsList citations={filteredCitations} highlightedId={highlightedCitation} />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <Card className="p-5 bg-slate-900/50 border-slate-700">
                    <h4 className="text-lg font-semibold mb-4">Provenance</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-slate-200">Norms Version: </span>
                        <span className="text-slate-300">{analysis.datasetVersion}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-200">Dataset: </span>
                        <span className="text-slate-300">Multi-center clinical trials</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-200">Pipeline: </span>
                        <span className="text-slate-300">{analysis.modelVersion}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-200">Limitations: </span>
                        <span className="text-slate-300">
                          2D analysis, camera angle dependent, speed-specific norms
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("overview")}
                      className="w-full mt-4 bg-slate-800 border-slate-700 hover:bg-slate-700"
                    >
                      View Data & Methods
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
