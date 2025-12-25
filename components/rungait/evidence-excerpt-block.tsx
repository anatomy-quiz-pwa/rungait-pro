"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"
import type { EvidenceExcerpt, LiteratureCitation } from "@/lib/types"

interface EvidenceExcerptBlockProps {
  excerpts: EvidenceExcerpt[]
  citations: LiteratureCitation[]
  onCitationClick?: (citationId: string) => void
}

export function EvidenceExcerptBlock({ excerpts, citations, onCitationClick }: EvidenceExcerptBlockProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getCitation = (id: string) => citations.find((c) => c.id === id)

  const handleCopyReference = (citation: LiteratureCitation) => {
    const reference = `${citation.author} (${citation.year}). ${citation.title || ""}. ${citation.journal || ""}. ${citation.doi ? `https://doi.org/${citation.doi}` : ""}`
    navigator.clipboard.writeText(reference)
    setCopiedId(citation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text

    let highlightedText = text
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight})`, "gi")
      highlightedText = highlightedText.replace(regex, "<mark>$1</mark>")
    })

    return highlightedText
  }

  if (excerpts.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-slate-700">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-slate-300 hover:text-slate-100 hover:bg-slate-800 -ml-2"
      >
        {isExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
        {t("evidenceExcerpt")} ({excerpts.length})
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {excerpts.map((excerpt) => {
            const citation = getCitation(excerpt.citationId)
            if (!citation) return null

            return (
              <div key={excerpt.citationId} className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onCitationClick?.(excerpt.citationId)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    {citation.author} ({citation.year})
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyReference(citation)}
                    className="h-6 px-2 hover:bg-slate-700"
                  >
                    {copiedId === citation.id ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <p
                  className="text-sm text-slate-300 leading-relaxed [&_mark]:bg-cyan-500/30 [&_mark]:text-cyan-200 [&_mark]:px-1 [&_mark]:rounded"
                  dangerouslySetInnerHTML={{ __html: highlightText(excerpt.excerpt, excerpt.highlight) }}
                />

                {citation.extractedRanges && citation.extractedRanges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {citation.extractedRanges.slice(0, 2).map((range, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-slate-700/50 border-slate-600 text-xs text-slate-300"
                      >
                        {range.phase}: {range.min}–{range.max}°
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
