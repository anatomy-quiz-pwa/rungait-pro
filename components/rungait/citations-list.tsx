"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Download } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"
import type { LiteratureCitation, GaitPhase, JointType } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const phaseLabels: Record<GaitPhase, string> = {
  IC: "IC",
  LR: "LR",
  MS: "MS",
  TS: "TS",
  PSw: "PSw",
  ISw: "ISw",
  MidSw: "MidSw",
  TSw: "TSw",
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

interface CitationsListProps {
  citations: LiteratureCitation[]
  highlightedId?: string
  appendixCitations?: LiteratureCitation[]
  onExportAppendix?: () => void
}

export function CitationsList({ citations, highlightedId, appendixCitations, onExportAppendix }: CitationsListProps) {
  const { t } = useI18n()

  const evidenceLevelColors: Record<string, string> = {
    consensus: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    systematic: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    clinical: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "single-study": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "expert-opinion": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {citations.map((citation) => (
          <Card
            key={citation.id}
            id={`citation-${citation.id}`}
            className={`p-5 bg-slate-900/50 border-slate-700 transition-all duration-300 ${
              highlightedId === citation.id ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20" : ""
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-semibold text-slate-100">
                      {citation.author} ({citation.year})
                    </h4>
                    {citation.evidenceLevel && (
                      <Badge className={evidenceLevelColors[citation.evidenceLevel]}>
                        {citation.evidenceLevel.replace("-", " ")}
                      </Badge>
                    )}
                  </div>
                  {citation.title && <p className="text-sm text-slate-300">{citation.title}</p>}
                  {citation.journal && <p className="text-sm text-slate-400 italic">{citation.journal}</p>}
                </div>
                {citation.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(citation.url, "_blank")}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700 shrink-0"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    DOI
                  </Button>
                )}
              </div>

              {citation.context && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <span className="font-medium text-slate-200">Context: </span>
                    {citation.context}
                  </p>
                </div>
              )}

              {citation.extractedRanges && citation.extractedRanges.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-200 mb-2">{t("extractedFinding")}:</h5>
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                          <TableHead className="text-slate-300">{t("phase")}</TableHead>
                          <TableHead className="text-slate-300">{t("joint")}</TableHead>
                          <TableHead className="text-slate-300">Range</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citation.extractedRanges.map((range, idx) => (
                          <TableRow key={idx} className="border-slate-700">
                            <TableCell className="font-mono text-cyan-300">{phaseLabels[range.phase]}</TableCell>
                            <TableCell className="text-slate-300">{jointLabels[range.joint]}</TableCell>
                            <TableCell className="text-slate-300">
                              {range.min}–{range.max}°
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {appendixCitations && appendixCitations.length > 0 && (
        <div className="pt-6 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-100">{t("referenceAppendix")}</h3>
            <Button
              variant="outline"
              onClick={onExportAppendix}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {t("exportAppendix")}
            </Button>
          </div>

          <div className="space-y-4 print:space-y-3">
            {appendixCitations.map((citation, idx) => (
              <Card
                key={citation.id}
                className="p-4 bg-slate-900/30 border-slate-700 print:bg-white print:border-gray-300 print:break-inside-avoid"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-bold text-cyan-400 print:text-cyan-800 mt-0.5">[{idx + 1}]</span>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-slate-200 print:text-black">
                        <span className="font-semibold">{citation.author}</span> ({citation.year}).{" "}
                        {citation.title && <span className="italic">{citation.title}.</span>}{" "}
                        {citation.journal && <span>{citation.journal}.</span>}
                      </p>
                      {citation.doi && (
                        <p className="text-xs text-slate-400 print:text-gray-600">
                          DOI: https://doi.org/{citation.doi}
                        </p>
                      )}
                      {citation.context && (
                        <p className="text-xs text-slate-400 print:text-gray-600 italic">Context: {citation.context}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
