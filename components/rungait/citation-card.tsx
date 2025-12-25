import type { Citation } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface CitationCardProps {
  citation: Citation
}

export function CitationCard({ citation }: CitationCardProps) {
  return (
    <Card className="p-4 bg-slate-800/50 border-slate-700">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h4 className="font-medium text-slate-100 leading-snug">{citation.title}</h4>
          {citation.doi && (
            <a
              href={`https://doi.org/${citation.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <p className="text-sm text-slate-400">
          {citation.author} ({citation.year})
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{citation.summary}</p>
      </div>
    </Card>
  )
}
