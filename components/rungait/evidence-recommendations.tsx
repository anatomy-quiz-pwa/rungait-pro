"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, BarChart3 } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { EvidenceExcerptBlock } from "./evidence-excerpt-block"
import type { EvidenceRecommendation, LiteratureCitation, GaitPhase, JointType } from "@/lib/types"

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

interface EvidenceRecommendationsProps {
  items: EvidenceRecommendation[]
  citations: LiteratureCitation[]
  onJumpPhase?: (phase: GaitPhase) => void
  onOpenChart?: (phase: GaitPhase, joint: JointType) => void
  onCitationClick?: (citationId: string) => void
  onAppendixToggle?: (id: string, selected: boolean) => void
}

export function EvidenceRecommendations({
  items,
  citations,
  onJumpPhase,
  onOpenChart,
  onCitationClick,
  onAppendixToggle,
}: EvidenceRecommendationsProps) {
  const { t } = useI18n()

  const confidenceColors = {
    high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  }

  const getCitation = (id: string) => citations.find((c) => c.id === id)

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="p-5 bg-slate-900/50 border-slate-700">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono">
                    {phaseLabels[item.phase]}
                  </Badge>
                  {item.joints.map((joint) => (
                    <Badge key={joint} variant="outline" className="bg-slate-800 border-slate-600 text-slate-300">
                      {jointLabels[joint]}
                    </Badge>
                  ))}
                  <Badge className={confidenceColors[item.confidence]}>
                    {t(item.confidence)} {t("confidence")}
                  </Badge>
                </div>

                <p className="text-slate-100 leading-relaxed">{item.recommendation}</p>

                {item.triggered.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400">Triggered Features:</p>
                    <ul className="space-y-1">
                      {item.triggered.map((trigger, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>{trigger}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {item.excerpts && item.excerpts.length > 0 && (
              <EvidenceExcerptBlock excerpts={item.excerpts} citations={citations} onCitationClick={onCitationClick} />
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">{t("supportingCitations")}:</p>
              <div className="flex flex-wrap gap-2">
                {item.citationIds.map((citationId) => {
                  const citation = getCitation(citationId)
                  if (!citation) return null
                  return (
                    <button
                      key={citationId}
                      onClick={() => onCitationClick?.(citationId)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 transition-colors"
                      aria-label={`Jump to ${citation.author} ${citation.year}`}
                    >
                      {citation.author} {citation.year}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onJumpPhase?.(item.phase)}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t("jumpToPhase")}
                </Button>
                {item.joints.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChart?.(item.phase, item.joints[0])}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t("openChart")}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor={`appendix-${item.id}`} className="text-sm text-slate-300 cursor-pointer">
                  {t("addToAppendix")}
                </label>
                <Switch
                  id={`appendix-${item.id}`}
                  checked={item.appendixSelected}
                  onCheckedChange={(checked) => onAppendixToggle?.(item.id, checked)}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}

      {items.length === 0 && (
        <Card className="p-8 bg-slate-900/30 border-slate-700">
          <div className="text-center">
            <p className="text-slate-400">{t("noData")}</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filter criteria.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
