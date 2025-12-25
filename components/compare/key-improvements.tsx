import type { GaitPhase, JointType } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { JOINT_LABELS } from "@/lib/phase"

export type SourceTag = "official" | "pubmed" | "personal"

export interface RefItem {
  source: SourceTag
  cite: string
  url?: string
}

export interface Improvement {
  phase: GaitPhase
  joint: JointType
  text: string
  basedOn: SourceTag[]
  refs: RefItem[]
}

interface KeyImprovementsProps {
  items: Improvement[]
}

const sourceLabels: Record<SourceTag, string> = {
  official: "Standard Database",
  pubmed: "PubMed",
  personal: "Personal",
}

const sourceColors: Record<SourceTag, string> = {
  official: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  pubmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  personal: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

export function KeyImprovements({ items }: KeyImprovementsProps) {
  if (!items.length) {
    return (
      <Card className="p-6 bg-slate-800/30 border-slate-700">
        <h3 className="text-lg font-semibold mb-3 text-slate-100">Key Improvements</h3>
        <p className="text-slate-400 text-sm">No significant improvements detected for this comparison.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-slate-800/30 border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">Key Improvements</h3>

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{item.phase}</Badge>
              <div className="flex-1 space-y-2">
                <div>
                  <span className="text-slate-400 text-sm font-medium">{JOINT_LABELS[item.joint]}:</span>
                  <p className="text-slate-200 mt-1">{item.text}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Based on:</span>
                  {item.basedOn.map((source) => (
                    <Badge key={source} variant="outline" className={sourceColors[source]}>
                      {sourceLabels[source]}
                    </Badge>
                  ))}
                </div>

                {item.refs.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-2">References:</div>
                    <ul className="space-y-1">
                      {item.refs.map((ref, refIdx) => (
                        <li key={refIdx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-slate-500">•</span>
                          <span className="flex-1">
                            {ref.cite}
                            {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
